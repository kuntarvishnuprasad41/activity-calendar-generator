"use client";

import React from "react";

import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
} from "date-fns";
import { CalendarIcon, Printer, Trash2, Save, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Type for activities
type Activity = {
  id: string;
  title: string;
  date: Date | string; // Allow string for JSON serialization
  description: string;
};

export default function CalendarGenerator() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newActivity, setNewActivity] = useState<{
    title: string;
    date: string;
    description: string;
  }>({
    title: "",
    date: "",
    description: "",
  });

  // Calendar view state
  const [viewDate, setViewDate] = useState<Date>(new Date(2025, 0, 1)); // Start with January 2025
  const [selectedYear, setSelectedYear] = useState<string>("2025");
  const [selectedMonth, setSelectedMonth] = useState<string>("0"); // January

  // Dialog state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isActivityListOpen, setIsActivityListOpen] = useState(false);

  // File input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Handle adding a new activity
  const handleAddActivity = () => {
    if (!newActivity.title || !newActivity.date) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and date for the activity.",
        variant: "destructive",
      });
      return;
    }

    const activity: Activity = {
      id: Date.now().toString(),
      title: newActivity.title,
      date: new Date(newActivity.date),
      description: newActivity.description,
    };

    setActivities([...activities, activity]);
    setNewActivity({
      title: "",
      date: "",
      description: "",
    });
    setIsDialogOpen(false);

    toast({
      title: "Activity added",
      description: `"${activity.title}" has been added to the calendar.`,
    });
  };

  // Handle removing an activity
  const handleRemoveActivity = (id: string) => {
    setActivities(activities.filter((activity) => activity.id !== id));
    toast({
      title: "Activity removed",
      description: "The activity has been removed from the calendar.",
    });
  };

  // Handle printing the calendar
  const handlePrint = () => {
    window.print();
  };

  // Update view date when year or month changes
  const updateViewDate = (year: string, month: string) => {
    setViewDate(new Date(Number.parseInt(year), Number.parseInt(month), 1));
  };

  // Handle double click on a day
  const handleDayDoubleClick = (day: Date) => {
    setSelectedDate(day);
    setNewActivity({
      ...newActivity,
      date: format(day, "yyyy-MM-dd"),
    });
    setIsDialogOpen(true);
  };

  // Generate calendar days for the current view month
  const days = eachDayOfInterval({
    start: startOfMonth(viewDate),
    end: endOfMonth(viewDate),
  });

  // Get activities for the current month
  const getActivitiesForDay = (day: Date) => {
    return activities.filter((activity) => {
      const activityDate =
        activity.date instanceof Date ? activity.date : new Date(activity.date);
      return isSameDay(activityDate, day);
    });
  };

  // Save activities to a JSON file
  const saveActivitiesToFile = () => {
    try {
      // Convert dates to ISO strings for JSON serialization
      const activitiesToSave = activities.map((activity) => ({
        ...activity,
        date:
          activity.date instanceof Date
            ? activity.date.toISOString()
            : activity.date,
      }));

      const jsonString = JSON.stringify(activitiesToSave, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // Create a download link and trigger it
      const a = document.createElement("a");
      a.href = url;
      a.download = `aup_school_calendar_${format(
        new Date(),
        "yyyy-MM-dd"
      )}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Calendar saved",
        description: "Your activities have been saved to a JSON file.",
      });
    } catch (error) {
      console.error("Error saving file:", error);
      toast({
        title: "Error saving file",
        description: "There was a problem saving your activities.",
        variant: "destructive",
      });
    }
  };

  // Load activities from a JSON file
  const loadActivitiesFromFile = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const loadedActivities = JSON.parse(content);

        // Convert ISO date strings back to Date objects
        const processedActivities = loadedActivities.map(
          (activity: Activity) => ({
            ...activity,
            date: new Date(activity.date),
          })
        );

        setActivities(processedActivities);

        toast({
          title: "Calendar loaded",
          description: `Loaded ${processedActivities.length} activities from file.`,
        });
      } catch (error) {
        console.error("Error parsing JSON:", error);
        toast({
          title: "Error loading file",
          description: "The selected file is not a valid calendar file.",
          variant: "destructive",
        });
      }
    };

    reader.onerror = () => {
      toast({
        title: "Error reading file",
        description: "There was a problem reading the selected file.",
        variant: "destructive",
      });
    };

    reader.readAsText(file);

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Trigger file input click
  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">Calendar</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsActivityListOpen(!isActivityListOpen)}
            className="ml-2"
          >
            {isActivityListOpen ? "Hide" : "Show"} Activity List
          </Button>
        </div>
        <div className="flex space-x-2">
          <Select
            value={selectedYear}
            onValueChange={(value) => {
              setSelectedYear(value);
              updateViewDate(value, selectedMonth);
            }}
          >
            <SelectTrigger className="w-[100px]">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedMonth}
            onValueChange={(value) => {
              setSelectedMonth(value);
              updateViewDate(selectedYear, value);
            }}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">January</SelectItem>
              <SelectItem value="1">February</SelectItem>
              <SelectItem value="2">March</SelectItem>
              <SelectItem value="3">April</SelectItem>
              <SelectItem value="4">May</SelectItem>
              <SelectItem value="5">June</SelectItem>
              <SelectItem value="6">July</SelectItem>
              <SelectItem value="7">August</SelectItem>
              <SelectItem value="8">September</SelectItem>
              <SelectItem value="9">October</SelectItem>
              <SelectItem value="10">November</SelectItem>
              <SelectItem value="11">December</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex space-x-2 print:hidden">
            <Button
              onClick={saveActivitiesToFile}
              variant="outline"
              size="icon"
              title="Save Calendar"
            >
              <Save className="h-4 w-4" />
              <span className="sr-only">Save Calendar</span>
            </Button>

            <Button
              onClick={handleImportClick}
              variant="outline"
              size="icon"
              title="Load Calendar"
            >
              <Upload className="h-4 w-4" />
              <span className="sr-only">Load Calendar</span>
            </Button>

            <Button
              onClick={handlePrint}
              variant="outline"
              size="icon"
              title="Print Calendar"
            >
              <Printer className="h-4 w-4" />
              <span className="sr-only">Print Calendar</span>
            </Button>

            {/* Hidden file input for importing */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={loadActivitiesFromFile}
              accept=".json"
              className="hidden"
            />
          </div>
        </div>
      </div>

      <div className="grid  w-[95%]">
        <div className={`md:col-span-${isActivityListOpen ? "3" : "4"}`}>
          <Card>
            <CardContent className="p-4">
              <div className="print-container">
                <div className="text-center mb-4 print:mb-2">
                  <h2 className="text-2xl font-bold">
                    {format(viewDate, "MMMM yyyy")}
                  </h2>
                  <p className="text-muted-foreground print:hidden">
                    A.U.P.School Kuntar Calendar
                  </p>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(
                    (day) => (
                      <div
                        key={day}
                        className="text-center font-medium p-2 bg-muted"
                      >
                        {day}
                      </div>
                    )
                  )}

                  {Array.from({ length: startOfMonth(viewDate).getDay() }).map(
                    (_, i) => (
                      <div
                        key={`empty-start-${i}`}
                        className="p-2 min-h-[120px]"
                      ></div>
                    )
                  )}

                  {days.map((day) => {
                    const dayActivities = getActivitiesForDay(day);
                    return (
                      <div
                        key={day.toString()}
                        className={`p-2 border min-h-[120px] relative cursor-pointer hover:bg-muted/50 transition-colors ${
                          isSameMonth(day, viewDate)
                            ? ""
                            : "text-muted-foreground"
                        }`}
                        onDoubleClick={() => handleDayDoubleClick(day)}
                      >
                        <div className="font-medium">{format(day, "d")}</div>
                        <div className="mt-1 space-y-1 max-h-[90px] overflow-y-auto">
                          {dayActivities.map((activity) => (
                            <div
                              key={activity.id}
                              className="text-xs p-1 bg-primary/10 rounded truncate"
                              title={`${activity.title}${
                                activity.description
                                  ? `: ${activity.description}`
                                  : ""
                              }`}
                            >
                              {activity.title}
                            </div>
                          ))}
                        </div>
                        {dayActivities.length > 0 && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                    );
                  })}

                  {Array.from({
                    length:
                      6 * 7 - (startOfMonth(viewDate).getDay() + days.length),
                  }).map((_, i) => (
                    <div
                      key={`empty-end-${i}`}
                      className="p-2 min-h-[120px]"
                    ></div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {isActivityListOpen && (
          <div className="md:col-span-1">
            <Card className="h-full">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium">Activities</h3>
                  <div className="text-sm text-muted-foreground">
                    {activities.length}{" "}
                    {activities.length === 1 ? "activity" : "activities"}
                  </div>
                </div>

                {activities.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CalendarIcon className="mx-auto h-12 w-12 opacity-50 mb-2" />
                    <p>No activities added yet</p>
                    <p className="text-sm">
                      Double-click on a date to add an activity
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto">
                    {activities
                      .sort((a, b) => {
                        const dateA =
                          a.date instanceof Date ? a.date : new Date(a.date);
                        const dateB =
                          b.date instanceof Date ? b.date : new Date(b.date);
                        return dateA.getTime() - dateB.getTime();
                      })
                      .map((activity) => {
                        const activityDate =
                          activity.date instanceof Date
                            ? activity.date
                            : new Date(activity.date);

                        return (
                          <div
                            key={activity.id}
                            className="flex items-center justify-between p-3 border rounded-md"
                          >
                            <div>
                              <div className="font-medium">
                                {activity.title}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {format(activityDate, "MMMM d, yyyy")}
                              </div>
                              {activity.description && (
                                <div className="text-sm mt-1">
                                  {activity.description}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveActivity(activity.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span className="sr-only">Remove</span>
                            </Button>
                          </div>
                        );
                      })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Add Activity Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Activity</DialogTitle>
            <DialogDescription>
              {selectedDate
                ? `Add an activity for ${format(selectedDate, "MMMM d, yyyy")}`
                : "Add a new activity"}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Activity Title</Label>
              <Input
                id="title"
                placeholder="Enter activity title"
                value={newActivity.title}
                onChange={(e) =>
                  setNewActivity({ ...newActivity, title: e.target.value })
                }
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Enter activity description"
                value={newActivity.description}
                onChange={(e) =>
                  setNewActivity({
                    ...newActivity,
                    description: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddActivity}>Add Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-container,
          .print-container * {
            visibility: visible;
          }
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
