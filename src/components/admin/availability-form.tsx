"use client";

import { useMemo, useTransition, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useCreateAvailabilityRule } from "@/hooks/use-admin";

const schema = z
  .object({
    ruleType: z.enum(["weekly", "exception"]),
    weekday: z.string().optional(),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    date: z.string().optional(),
    isOpen: z.boolean().optional(),
  })
  .refine((value) => {
    if (value.ruleType === "weekly") {
      return value.weekday !== undefined && value.weekday !== "";
    }
    if (value.ruleType === "exception") {
      return Boolean(value.date);
    }
    return true;
  }, "Please complete all required fields.");

type FormValues = z.infer<typeof schema>;

export function AvailabilityForm({ studioId }: { studioId?: string }) {
  const createRule = useCreateAvailabilityRule(studioId);
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      ruleType: "weekly",
      isOpen: true,
    },
  });

  const ruleType = useWatch({ control, name: "ruleType" }) ?? "weekly";

  const onSubmit = (values: FormValues) => {
    setGeneralError(null);
    startTransition(async () => {
      if (!studioId) {
        setGeneralError("Select a studio before adding rules.");
        return;
      }
      try {
        await createRule.mutateAsync({
          ruleType: values.ruleType,
          weekday:
            values.ruleType === "weekly" && values.weekday
              ? Number(values.weekday)
              : undefined,
          startTime: values.startTime,
          endTime: values.endTime,
          date: values.ruleType === "exception" ? values.date ?? null : undefined,
          isOpen: values.ruleType === "exception" ? values.isOpen : true,
        });
        reset({ ruleType: values.ruleType, isOpen: true });
      } catch (error) {
        setGeneralError(
          error instanceof Error ? error.message : "Unable to save rule",
        );
      }
    });
  };

  const ruleLabel = useMemo(
    () => (ruleType === "weekly" ? "Day of week" : "Date"),
    [ruleType],
  );

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="ruleType">Rule type</Label>
          <Select id="ruleType" {...register("ruleType")}>
            <option value="weekly">Weekly schedule</option>
            <option value="exception">Exception</option>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="startTime">Start time</Label>
          <Input id="startTime" type="time" step="1800" {...register("startTime")}/>
          {errors.startTime && (
            <p className="text-xs text-red-500">{errors.startTime.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endTime">End time</Label>
          <Input id="endTime" type="time" step="1800" {...register("endTime")}/>
          {errors.endTime && (
            <p className="text-xs text-red-500">{errors.endTime.message}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ruleLabel">{ruleLabel}</Label>
          {ruleType === "weekly" ? (
            <Select id="weekday" {...register("weekday")}>
              <option value="">Select day</option>
              {weekdays.map((day) => (
                <option key={day.value} value={day.value}>
                  {day.label}
                </option>
              ))}
            </Select>
          ) : (
            <Input id="date" type="date" {...register("date")} />
          )}
          {errors.weekday && (
            <p className="text-xs text-red-500">{errors.weekday.message}</p>
          )}
          {errors.date && (
            <p className="text-xs text-red-500">{errors.date.message}</p>
          )}
        </div>
      </div>

      {ruleType === "exception" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" id="isOpen" {...register("isOpen")} />
          <Label htmlFor="isOpen">Slot should remain open (untick to close these hours)</Label>
        </div>
      )}

      {generalError && <p className="text-sm text-red-500">{generalError}</p>}

      <Button type="submit" disabled={!studioId || isPending || createRule.isPending}>
        {isPending || createRule.isPending ? "Saving..." : "Add rule"}
      </Button>
    </form>
  );
}

const weekdays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];
