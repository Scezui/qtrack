"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download } from "lucide-react";
import { useApp } from "@/components/providers";

export function AttendanceLog() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const { attendanceLog } = useApp();

  const selectedDateString = date ? format(date, "yyyy-MM-dd") : "";
  const recordsForSelectedDate = attendanceLog[selectedDateString] || [];

  const exportToCSV = () => {
    if (recordsForSelectedDate.length === 0) return;

    const headers = ["Name", "Student ID", "Timestamp"];
    const rows = recordsForSelectedDate.map(record => [
      `"${record.user.name}"`,
      `"${record.user.studentId}"`,
      `"${format(new Date(record.timestamp), "yyyy-MM-dd HH:mm:ss")}"`
    ]);

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance-log-${selectedDateString}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <div className="md:col-span-1">
        <Card>
            <CardHeader>
                <CardTitle>Select a Date</CardTitle>
                <CardDescription>Pick a day to view attendance records.</CardDescription>
            </CardHeader>
            <CardContent>
                <Calendar
                    mode="single"
                    selected={date}
                    onSelect={setDate}
                    className="rounded-md border p-0"
                    disabled={(date) => date > new Date() || date < new Date("2000-01-01")}
                />
            </CardContent>
        </Card>
      </div>

      <div className="md:col-span-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Attendance Report</CardTitle>
              <CardDescription>
                Showing records for {date ? format(date, "MMMM d, yyyy") : "N/A"}
              </CardDescription>
            </div>
            <Button onClick={exportToCSV} disabled={recordsForSelectedDate.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Student ID</TableHead>
                    <TableHead>Time Logged</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recordsForSelectedDate.length > 0 ? (
                    recordsForSelectedDate.map((record, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{record.user.name}</TableCell>
                        <TableCell>{record.user.studentId}</TableCell>
                        <TableCell>{format(new Date(record.timestamp), "HH:mm:ss a")}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No records for this date.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
