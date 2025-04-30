import React, { useEffect, useState } from "react";
import axios from "axios";
import { Table, Typography, Spin, Button, message } from "antd";

interface RawRegistration {
  registrationId: number;
  studentId: number;
  classId: number;
  registrationStatus: string;
  groupRegistrationId?: number | null;
}

interface EnrichedRegistration {
  registrationId: number;
  studentId: number;
  registrationStatus: string;
  groupRegistrationId?: number | null;
  groupRegistration: boolean;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  courseName: string;
  members: string;
  vacancy: number;
  groupSize: number;
}

export const MyRegistrationPage: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [registrations, setRegistrations] = useState<EnrichedRegistration[]>([]);
  const [studentId, setStudentId] = useState<number | null>(null);

  // Get studentId from localStorage
  useEffect(() => {
    const userDetails = localStorage.getItem("user_details");
    if (userDetails) {
      const user = JSON.parse(userDetails);
      if (user.studentId) {
        setStudentId(user.studentId);
        console.log(studentId);

      }
    }
  }, []);

  // helper to reload everything
  const fetchAll = async () => {
    if (!studentId) {
      console.log("fetchAll called but studentId is null");
      return;
    }
    console.log("Fetching registrations for studentId:", studentId);
    setLoading(true);
    try {
      const { data: rawRegs } = await axios.get<RawRegistration[]>(
        "http://localhost:8083/api/courseRegistration",
        { params: { studentId } } // Use the studentId from state
      );
      const regs = rawRegs.map(r => ({
        ...r,
        groupRegistration: r.groupRegistrationId != null,
      }));

      const classIds = Array.from(new Set(regs.map(r => r.classId)));
      const classResponses = await Promise.all(
        classIds.map(id =>
          axios.get<{
            classId: number;
            courseId: number;
            dayOfWeek: string;
            startTime: string;
            endTime: string;
            vacancy: number;
          }>(`http://localhost:8081/api/classes/${id}`)
        )
      );
      const classesMap: Record<
        number,
        { courseId: number; dayOfWeek: string; startTime: string; endTime: string; vacancy: number }
      > = {};
      classResponses.forEach(({ data: c }) => {
        classesMap[c.classId] = {
          courseId: c.courseId,
          dayOfWeek: c.dayOfWeek,
          startTime: c.startTime,
          endTime: c.endTime,
          vacancy: c.vacancy,
        };
      });

      // courses
      const courseIds = Array.from(
        new Set(classResponses.map(r => r.data.courseId))
      );
      const courseResponses = await Promise.all(
        courseIds.map(cid =>
          axios.get<{ courseId: number; courseName: string }>(
            `http://localhost:8081/api/courses/courseId/${cid}`
          )
        )
      );
      const coursesMap: Record<number, string> = {};
      courseResponses.forEach(({ data: c }) => {
        coursesMap[c.courseId] = c.courseName;
      });

      // 4) group members
      const groupIds = Array.from(
        new Set(
          regs
            .filter(r => r.groupRegistration)
            .map(r => r.groupRegistrationId as number)
        )
      );
      const groupMembersMap: Record<number, { studentId: number; name: string }[]> = {};
      await Promise.all(
        groupIds.map(async gid => {
          const { data: groupRegs } = await axios.get<RawRegistration[]>(
            "http://localhost:8083/api/courseRegistration",
            { params: { groupRegistrationId: gid } }
          );
          const uniqueSids = Array.from(
            new Set(groupRegs.map(gr => gr.studentId))
          );
          const members = await Promise.all(
            uniqueSids.map(async sid => {
              const { data: s } = await axios.get<{ studentId: number; name: string }>(
                `http://localhost:8085/api/students/${sid}`
              );
              return { studentId: s.studentId, name: s.name };
            })
          );
          groupMembersMap[gid] = members;
        })
      );

      // 5) enrich
      const enriched = regs.map(r => {
        const cls = classesMap[r.classId];
        const courseName = coursesMap[cls.courseId];
        const membersList = r.groupRegistration
          ? groupMembersMap[r.groupRegistrationId as number]
          : [];
        const membersStr = membersList
          .filter(m => m.studentId !== r.studentId)
          .map(m => m.name)
          .join(", ");
        const groupSize = r.groupRegistration ? membersList.length : 1;

        return {
          registrationId: r.registrationId,
          studentId: r.studentId,
          registrationStatus: r.registrationStatus,
          groupRegistrationId: r.groupRegistrationId,
          groupRegistration: r.groupRegistration,
          dayOfWeek: cls.dayOfWeek,
          startTime: cls.startTime,
          endTime: cls.endTime,
          courseName,
          members: membersStr,
          vacancy: cls.vacancy,
          groupSize,
        };
      });

      setRegistrations(enriched);
    } catch (err) {
      console.error(err);
      message.error("Could not load your registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      fetchAll();
    }
  }, [studentId]);

  const handleUnenroll = async (registrationId: number) => {
    try {
      await axios.put(
        `http://localhost:8083/api/courseRegistration/unenroll/${registrationId}`
      );
      message.success("Unenrolled successfully");
      fetchAll();
    } catch {
      message.error("Failed to unenroll");
    }
  };

  const handleEnroll = async (idRegistration: number, identifier: number) => {
    try {
      await axios.put(
        "http://localhost:8083/api/courseRegistration/status",
        {
          id: idRegistration,
          newStatus: "Registered",
          identifier,
        }
      );
      message.success("Enrolled successfully");
      fetchAll();
    } catch {
      message.error("Failed to enroll");
    }
  };

  const columns = [
    { title: "Course Name", dataIndex: "courseName", key: "courseName" },
    { title: "Day", dataIndex: "dayOfWeek", key: "dayOfWeek" },
    { title: "Start Time", dataIndex: "startTime", key: "startTime" },
    { title: "End Time", dataIndex: "endTime", key: "endTime" },
    {
      title: "Members",
      dataIndex: "members",
      key: "members",
      render: (m: string) => m || "—",
    },
    {
      title: "Action",
      key: "action",
      render: (_: any, record: EnrichedRegistration) => {
        if (record.registrationStatus === "Registered") {
          return (
            <Button danger onClick={() => handleUnenroll(record.registrationId)}>
              Unenroll
            </Button>
          );
        }
        if (
          record.registrationStatus === "Waitlisted" &&
          record.vacancy >= record.groupSize
        ) {
          const idFlag = record.groupRegistration ? 2 : 1;
          const idRegistration = record.groupRegistration ? record.groupRegistrationId! : record.registrationId;
          return (
            <Button
              type="primary"
              onClick={() => handleEnroll(idRegistration, idFlag)}
            >
              Enroll
            </Button>
          );
        }
        return null;
      },
    },
  ];

  if (!studentId) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Typography.Text>Please log in as a student to view registrations</Typography.Text>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: 50 }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={3}>Registered</Typography.Title>
      <Typography.Title level={5}>Individual</Typography.Title>
      <Table
        rowKey="registrationId"
        columns={columns}
        dataSource={registrations.filter(
          r => r.registrationStatus === "Registered" && !r.groupRegistration
        )}
        pagination={false}
      />

      <Typography.Title level={5} style={{ marginTop: 32 }}>
        Group
      </Typography.Title>
      <Table
        rowKey="registrationId"
        columns={columns}
        dataSource={registrations.filter(
          r => r.registrationStatus === "Registered" && r.groupRegistration
        )}
        pagination={false}
      />
      <Typography.Title level={3} style={{ marginTop: 32 }}>Waitlisted</Typography.Title>
      <Typography.Title level={5} style={{ marginTop: 32 }}>
        Individual
      </Typography.Title>
      <Table
        rowKey="registrationId"
        columns={columns}
        dataSource={registrations.filter(
          r => r.registrationStatus === "Waitlisted" && !r.groupRegistration
        )}
        pagination={false}
      />

      <Typography.Title level={5} style={{ marginTop: 32 }}>
        Group
      </Typography.Title>
      <Table
        rowKey="registrationId"
        columns={columns}
        dataSource={registrations.filter(
          r => r.registrationStatus === "Waitlisted" && r.groupRegistration
        )}
        pagination={false}
      />
    </div>
  );
};