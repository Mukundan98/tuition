"use client";

import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  closestCorners,
} from "@dnd-kit/core";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch, apiJson } from "@/lib/api";
import type { SchoolClassRow, SubjectRow } from "@/lib/types";
import { firstError } from "@/lib/types";
import { cn } from "@/lib/utils";
import { timetableDayLong, timetableDayOrder } from "@/lib/timetable-utils";

export type AdminBoardScheduleRow = {
  id: number;
  subject_id: number | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  subject: { id: number; name: string; code: string } | null;
};

function resolveDropDay(
  overId: string | number,
  rows: AdminBoardScheduleRow[]
): number | null {
  const s = String(overId);
  if (s.startsWith("day-")) {
    const n = Number(s.slice(4));
    return Number.isNaN(n) ? null : n;
  }
  if (s.startsWith("slot-")) {
    const id = Number(s.slice(5));
    const hit = rows.find((r) => r.id === id);
    return hit != null ? hit.day_of_week : null;
  }
  return null;
}

function DayColumn({
  day,
  children,
}: {
  day: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `day-${day}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[200px] w-[11rem] shrink-0 flex-col gap-2 rounded-xl border border-dashed bg-muted/15 p-2 transition-colors",
        isOver && "border-primary/50 bg-primary/[0.06]"
      )}
    >
      <div className="px-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {timetableDayLong(day)}
      </div>
      <div className="flex flex-1 flex-col gap-2">{children}</div>
    </div>
  );
}

function SlotCard({
  row,
  onTimeChange,
  onTimeCommit,
  onRemove,
}: {
  row: AdminBoardScheduleRow;
  onTimeChange: (
    id: number,
    field: "start_time" | "end_time",
    value: string
  ) => void;
  onTimeCommit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `slot-${row.id}`,
      data: { row },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px,${transform.y}px,0)`,
        zIndex: isDragging ? 20 : undefined,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card p-2 text-xs shadow-sm ring-1 ring-border/60",
        isDragging && "opacity-80 shadow-lg"
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          className="mt-0.5 cursor-grab touch-none rounded p-0.5 text-muted-foreground hover:bg-muted"
          aria-label="Drag to move day"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="size-3.5" />
        </button>
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="font-medium leading-tight text-foreground line-clamp-2">
            {row.subject ? row.subject.name : "Free / unassigned"}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <Input
              type="time"
              className="h-7 w-[5.75rem] px-1.5 text-[11px]"
              value={row.start_time}
              onChange={(e) => onTimeChange(row.id, "start_time", e.target.value)}
              onBlur={onTimeCommit}
            />
            <span className="text-muted-foreground">–</span>
            <Input
              type="time"
              className="h-7 w-[5.75rem] px-1.5 text-[11px]"
              value={row.end_time}
              onChange={(e) => onTimeChange(row.id, "end_time", e.target.value)}
              onBlur={onTimeCommit}
            />
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0 text-destructive"
          aria-label="Remove slot"
          onClick={onRemove}
        >
          <Trash2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

export function TimetableAdminBoardClient() {
  const [classes, setClasses] = useState<SchoolClassRow[]>([]);
  const [classId, setClassId] = useState("");
  const [subjects, setSubjects] = useState<SubjectRow[]>([]);
  const [schedules, setSchedules] = useState<AdminBoardScheduleRow[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [newDay, setNewDay] = useState("1");
  const [newSubject, setNewSubject] = useState("");
  const [newStart, setNewStart] = useState("09:00");
  const [newEnd, setNewEnd] = useState("10:00");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const selectedClass = useMemo(
    () => classes.find((c) => String(c.id) === classId),
    [classes, classId]
  );

  useEffect(() => {
    void (async () => {
      const r = await apiFetch<{ items: SchoolClassRow[] }>("classes?per_page=100");
      if (r.json?.success && r.json.data?.items) setClasses(r.json.data.items);
    })();
  }, []);

  const loadSchedules = useCallback(async (cid: string) => {
    if (!cid) {
      setSchedules([]);
      return;
    }
    setLoadingList(true);
    const r = await apiFetch<{ schedules: AdminBoardScheduleRow[] }>(
      `classes/${cid}/schedules`
    );
    setLoadingList(false);
    if (!r.ok || !r.json?.success || !r.json.data) {
      toast.error(r.json?.message ?? "Could not load schedules.");
      setSchedules([]);
      return;
    }
    setSchedules(r.json.data.schedules);
  }, []);

  useEffect(() => {
    void loadSchedules(classId);
  }, [classId, loadSchedules]);

  useEffect(() => {
    if (!classId) {
      setSubjects([]);
      return;
    }
    void (async () => {
      const r = await apiFetch<{ items: SubjectRow[] }>(
        `subjects?class_id=${classId}&per_page=100`
      );
      if (r.json?.success && r.json.data?.items) setSubjects(r.json.data.items);
    })();
  }, [classId]);

  const persist = useCallback(
    async (next: AdminBoardScheduleRow[]) => {
      if (!classId) return;
      for (let i = 0; i < next.length; i++) {
        const r = next[i];
        if (r.end_time <= r.start_time) {
          toast.error(`Period ${i + 1}: end time must be after start.`);
          return;
        }
      }
      setSaving(true);
      const body = {
        schedules: next.map((r) => ({
          day_of_week: r.day_of_week,
          start_time: r.start_time,
          end_time: r.end_time,
          subject_id: r.subject_id,
        })),
      };
      const r = await apiJson<{ schedules: AdminBoardScheduleRow[] }>(
        `classes/${classId}/schedules`,
        "PUT",
        body
      );
      setSaving(false);
      if (!r.ok || !r.json?.success) {
        toast.error(
          firstError(r.json?.errors) ?? r.json?.message ?? "Save failed."
        );
        void loadSchedules(classId);
        return;
      }
      if (r.json.data?.schedules) {
        setSchedules(r.json.data.schedules);
      } else {
        void loadSchedules(classId);
      }
      toast.success("Timetable saved.", { id: "timetable-save", duration: 2200 });
    },
    [classId, loadSchedules]
  );

  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const overDay = resolveDropDay(over.id, schedules);
    const aid = String(active.id);
    if (!aid.startsWith("slot-") || overDay === null) return;
    const sid = Number(aid.slice(5));
    if (Number.isNaN(sid)) return;
    const current = schedules.find((r) => r.id === sid);
    if (!current || current.day_of_week === overDay) return;
    const next = schedules.map((r) =>
      r.id === sid ? { ...r, day_of_week: overDay } : r
    );
    setSchedules(next);
    void persist(next);
  }

  function onTimeChange(
    id: number,
    field: "start_time" | "end_time",
    value: string
  ) {
    setSchedules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
  }

  function onTimeCommit() {
    setSchedules((current) => {
      void persist(current);
      return current;
    });
  }

  function removeSlot(id: number) {
    const next = schedules.filter((r) => r.id !== id);
    setSchedules(next);
    void persist(next);
  }

  function addSlot() {
    if (!classId || !newSubject) {
      toast.error("Choose class and subject.");
      return;
    }
    const sub = subjects.find((s) => String(s.id) === newSubject);
    const dayNum = Number(newDay);
    if (Number.isNaN(dayNum) || dayNum < 0 || dayNum > 6) {
      toast.error("Invalid day.");
      return;
    }
    const row: AdminBoardScheduleRow = {
      id: -Date.now(),
      subject_id: Number(newSubject),
      day_of_week: dayNum,
      start_time: newStart.slice(0, 5),
      end_time: newEnd.slice(0, 5),
      subject: sub
        ? { id: sub.id, name: sub.name, code: sub.code }
        : null,
    };
    const next = [...schedules, row].sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) return a.day_of_week - b.day_of_week;
      return a.start_time.localeCompare(b.start_time);
    });
    setSchedules(next);
    setAddOpen(false);
    void persist(next);
  }

  const byDay = useMemo(() => {
    const m: Record<number, AdminBoardScheduleRow[]> = {};
    for (const d of timetableDayOrder()) m[d] = [];
    for (const r of schedules) {
      if (!m[r.day_of_week]) m[r.day_of_week] = [];
      m[r.day_of_week].push(r);
    }
    for (const d of timetableDayOrder()) {
      m[d].sort((a, b) => a.start_time.localeCompare(b.start_time));
    }
    return m;
  }, [schedules]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Timetable board</h1>
        <p className="text-muted-foreground mt-1 text-sm max-w-2xl">
          Kanban by weekday: drag a card by the grip to move it to another day.
          Edit times on the card (tab out or click away to save). Students see only
          their class schedule; teachers see sessions they teach.
        </p>
      </div>

      <Card>
        <CardHeader className="border-b flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Class schedule</CardTitle>
            <CardDescription>
              {selectedClass
                ? `${selectedClass.name}${selectedClass.section ? ` · ${selectedClass.section}` : ""}`
                : "Select a class to edit its weekly timetable."}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <select
              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              aria-label="Class"
            >
              <option value="">Select class…</option>
              {classes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.name}
                  {c.section ? ` · ${c.section}` : ""}
                </option>
              ))}
            </select>
            <Button
              type="button"
              size="sm"
              disabled={!classId || saving}
              onClick={() => setAddOpen(true)}
            >
              <Plus className="size-4" />
              Add period
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {loadingList ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !classId ? (
            <p className="text-sm text-muted-foreground">
              Choose a class to load its timetable.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              onDragEnd={onDragEnd}
            >
              <div className="flex gap-2 overflow-x-auto pb-2">
                {timetableDayOrder().map((d) => (
                  <DayColumn key={d} day={d}>
                    {byDay[d]?.map((row) => (
                      <SlotCard
                        key={row.id}
                        row={row}
                        onTimeChange={onTimeChange}
                        onTimeCommit={onTimeCommit}
                        onRemove={() => removeSlot(row.id)}
                      />
                    ))}
                  </DayColumn>
                ))}
              </div>
            </DndContext>
          )}
          {saving ? (
            <p className="mt-3 text-xs text-muted-foreground">Saving…</p>
          ) : null}
        </CardContent>
      </Card>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add period</DialogTitle>
          </DialogHeader>
          <DialogBody className="space-y-3">
            <div className="space-y-2">
              <Label>Day</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                value={newDay}
                onChange={(e) => setNewDay(e.target.value)}
              >
                {timetableDayOrder().map((d) => (
                  <option key={d} value={String(d)}>
                    {timetableDayLong(d)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Subject</Label>
              <select
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm dark:bg-input/30"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
              >
                <option value="">Select subject…</option>
                {subjects.map((s) => (
                  <option key={s.id} value={String(s.id)}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <div className="space-y-2 flex-1">
                <Label>Start</Label>
                <Input
                  type="time"
                  value={newStart}
                  onChange={(e) => setNewStart(e.target.value)}
                />
              </div>
              <div className="space-y-2 flex-1">
                <Label>End</Label>
                <Input
                  type="time"
                  value={newEnd}
                  onChange={(e) => setNewEnd(e.target.value)}
                />
              </div>
            </div>
          </DialogBody>
          <DialogFooter className="flex-row justify-end gap-2 px-4 pb-4">
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={addSlot}>
              Add &amp; save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}