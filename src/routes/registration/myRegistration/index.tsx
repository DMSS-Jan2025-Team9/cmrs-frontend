import React, { useEffect, useState } from "react";
import { Table, Typography, Spin, Button, message } from "antd";

interface RegistrationDTO {
    registrationId: number;
    studentId: number;
    classId: number;
    registrationStatus: string;
    groupRegistrationId?: number | null;
}

interface GroupRegistration {
    groupId: number;
    registrations: RegistrationDTO[];
}

interface ClassDetails {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    vacancy: number;
}

export const MyRegistrationPage: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    // Registered data
    const [registeredIndividual, setRegisteredIndividual] = useState<RegistrationDTO[]>([]);
    const [registeredGroup, setRegisteredGroup] = useState<GroupRegistration[]>([]);
    // Waitlisted data
    const [waitlistedIndividual, setWaitlistedIndividual] = useState<RegistrationDTO[]>([]);
    const [waitlistedGroup, setWaitlistedGroup] = useState<GroupRegistration[]>([]);
    // Caches for student names
    const [studentNames, setStudentNames] = useState<{ [key: number]: string }>({});
    // Cache full class details (including dayOfWeek, startTime, endTime, vacancy)
    const [classDetails, setClassDetails] = useState<{ [key: number]: ClassDetails }>({});
    // Track unenrolled group registration IDs for highlighting (for current user)
    const [unenrolledGroupRegistrationIds, setUnenrolledGroupRegistrationIds] = useState<number[]>([]);

    // Hard-coded student ID
    const hardCodedStudentId = 1;

    // Fetch registrations and split them by status and type
    useEffect(() => {
        setLoading(true);
        fetch(`http://localhost:8083/api/courseRegistration?studentId=${hardCodedStudentId}`)
            .then((res) => res.json())
            .then((data: RegistrationDTO[]) => {
                // Split registrations by status
                const registered = data.filter(
                    (reg) => reg.registrationStatus === "Registered"
                );
                const waitlisted = data.filter(
                    (reg) => reg.registrationStatus === "Waitlisted"
                );

                // Registered Individual
                setRegisteredIndividual(registered.filter((reg) => !reg.groupRegistrationId));
                // Registered Group
                const regGroupIds = Array.from(
                    new Set(
                        registered
                            .filter((reg) => reg.groupRegistrationId != null)
                            .map((reg) => reg.groupRegistrationId as number)
                    )
                );
                Promise.all(
                    regGroupIds.map((groupId) =>
                        fetch(`http://localhost:8083/api/courseRegistration?groupRegistrationId=${groupId}`)
                            .then((res) => res.json())
                    )
                )
                    .then((groupDataArray: RegistrationDTO[][]) => {
                        const groups: GroupRegistration[] = regGroupIds.map((groupId, index) => ({
                            groupId,
                            registrations: groupDataArray[index],
                        }));
                        setRegisteredGroup(groups);
                    })
                    .catch((error) => {
                        console.error("Error fetching registered group registrations:", error);
                        message.error("Error fetching registered group registrations.");
                    });

                // Waitlisted Individual
                setWaitlistedIndividual(waitlisted.filter((reg) => !reg.groupRegistrationId));
                // Waitlisted Group
                const waitGroupIds = Array.from(
                    new Set(
                        waitlisted
                            .filter((reg) => reg.groupRegistrationId != null)
                            .map((reg) => reg.groupRegistrationId as number)
                    )
                );
                Promise.all(
                    waitGroupIds.map((groupId) =>
                        fetch(`http://localhost:8083/api/courseRegistration?groupRegistrationId=${groupId}`)
                            .then((res) => res.json())
                    )
                )
                    .then((groupDataArray: RegistrationDTO[][]) => {
                        const groups: GroupRegistration[] = waitGroupIds.map((groupId, index) => ({
                            groupId,
                            registrations: groupDataArray[index],
                        }));
                        setWaitlistedGroup(groups);
                    })
                    .catch((error) => {
                        console.error("Error fetching waitlisted group registrations:", error);
                        message.error("Error fetching waitlisted group registrations.");
                    });
            })
            .catch((error) => {
                console.error("Error fetching registrations:", error);
                message.error("Error fetching registrations.");
            })
            .finally(() => setLoading(false));
    }, []);

    // Fetch student names for group registrations
    useEffect(() => {
        const studentIdsToFetch = new Set<number>();
        [...registeredGroup, ...waitlistedGroup].forEach((group) => {
            group.registrations.forEach((reg) => {
                if (!studentNames[reg.studentId]) {
                    studentIdsToFetch.add(reg.studentId);
                }
            });
        });
        studentIdsToFetch.forEach((studentId) => {
            fetch(`http://localhost:8085/api/students/${studentId}`)
                .then((res) => res.json())
                .then((data) => {
                    // Assuming the returned data has a "name" property
                    setStudentNames((prev) => ({ ...prev, [studentId]: data.name }));
                })
                .catch((err) =>
                    console.error(`Error fetching student ${studentId}:`, err)
                );
        });
    }, [registeredGroup, waitlistedGroup, studentNames]);

    // Fetch full class details (dayOfWeek, startTime, endTime, vacancy) for all relevant class IDs
    useEffect(() => {
        const classIdsToFetch = new Set<number>();
        // Check individual registrations (registered & waitlisted)
        [...registeredIndividual, ...waitlistedIndividual].forEach((reg) => {
            if (!classDetails[reg.classId]) {
                classIdsToFetch.add(reg.classId);
            }
        });
        // Check group registrations
        registeredGroup.forEach((group) => {
            const classId = group.registrations[0]?.classId;
            if (classId && !classDetails[classId]) {
                classIdsToFetch.add(classId);
            }
        });
        waitlistedGroup.forEach((group) => {
            const classId = group.registrations[0]?.classId;
            if (classId && !classDetails[classId]) {
                classIdsToFetch.add(classId);
            }
        });
        classIdsToFetch.forEach((classId) => {
            fetch(`http://localhost:8081/api/classes/${classId}`)
                .then((res) => res.json())
                .then((data: ClassDetails) => {
                    // Assume data includes dayOfWeek, startTime, endTime, vacancy
                    setClassDetails((prev) => ({ ...prev, [classId]: data }));
                })
                .catch((err) =>
                    console.error("Error fetching class details:", err)
                );
        });
    }, [registeredIndividual, waitlistedIndividual, registeredGroup, waitlistedGroup, classDetails]);

    // Unenroll function (for both individual and group - uses same API)
    const handleUnenroll = (registrationId: number) => {
        fetch(`http://localhost:8083/api/courseRegistration/unenroll/${registrationId}`, {
            method: "PUT",
        })
            .then((response) => {
                if (response.ok) {
                    message.success("Unenrolled successfully");
                    // Refresh the page after unenrollment
                    window.location.reload();
                } else {
                    message.error("Failed to unenroll");
                }
            })
            .catch((error) => {
                console.error(error);
                message.error("Error during unenrollment");
            });
    };

    // For group registrations, highlight the current student's name if unenrolled
    const handleGroupUnenroll = (registrationId: number) => {
        fetch(`http://localhost:8083/api/courseRegistration/unenroll/${registrationId}`, {
            method: "PUT",
        })
            .then((response) => {
                if (response.ok) {
                    message.success("Unenrolled successfully");
                    setUnenrolledGroupRegistrationIds((prev) => [...prev, registrationId]);
                } else {
                    message.error("Failed to unenroll");
                }
            })
            .catch((error) => {
                console.error(error);
                message.error("Error during unenrollment");
            });
    };

    // Registered Individual Columns (Registration ID hidden)
    const registeredIndividualColumns = [
        {
            title: "Day",
            key: "dayOfWeek",
            render: (_: any, reg: RegistrationDTO) => {
                const details = classDetails[reg.classId];
                return details ? details.dayOfWeek : "Loading...";
            },
        },
        {
            title: "Start Time",
            key: "startTime",
            render: (_: any, reg: RegistrationDTO) => {
                const details = classDetails[reg.classId];
                return details ? details.startTime : "Loading...";
            },
        },
        {
            title: "End Time",
            key: "endTime",
            render: (_: any, reg: RegistrationDTO) => {
                const details = classDetails[reg.classId];
                return details ? details.endTime : "Loading...";
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, reg: RegistrationDTO) => (
                <Button onClick={() => handleUnenroll(reg.registrationId)}>
                    Unenroll
                </Button>
            ),
        },
    ];

    // Registered Group Columns (Group Registration ID hidden)
    const registeredGroupColumns = [
        {
            title: "Day",
            key: "dayOfWeek",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations[0]?.classId;
                const details = classId ? classDetails[classId] : undefined;
                return details ? details.dayOfWeek : "Loading...";
            },
        },
        {
            title: "Start Time",
            key: "startTime",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations[0]?.classId;
                const details = classId ? classDetails[classId] : undefined;
                return details ? details.startTime : "Loading...";
            },
        },
        {
            title: "End Time",
            key: "endTime",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations[0]?.classId;
                const details = classId ? classDetails[classId] : undefined;
                return details ? details.endTime : "Loading...";
            },
        },
        {
            title: "Students",
            key: "students",
            render: (_: any, record: GroupRegistration) => {
                return record.registrations.map((reg, index) => (
                    <span
                        key={reg.registrationId}
                        style={
                            unenrolledGroupRegistrationIds.includes(reg.registrationId)
                                ? { color: "red", fontWeight: "bold" }
                                : {}
                        }
                    >
                        {studentNames[reg.studentId] || "Loading..."}
                        {index < record.registrations.length - 1 ? ", " : ""}
                    </span>
                ));
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: GroupRegistration) => {
                const myRegistration = record.registrations.find(
                    (reg) => reg.studentId === hardCodedStudentId
                );
                if (myRegistration) {
                    return (
                        <Button onClick={() => handleGroupUnenroll(myRegistration.registrationId)}>
                            Unenroll
                        </Button>
                    );
                }
                return null;
            },
        },
    ];

    // Waitlisted Individual Columns (Registration ID hidden)
    const individualWaitlistedColumns = [
        {
            title: "Day",
            key: "dayOfWeek",
            render: (_: any, reg: RegistrationDTO) => {
                const details = classDetails[reg.classId];
                return details ? details.dayOfWeek : "Loading...";
            },
        },
        {
            title: "Start Time",
            key: "startTime",
            render: (_: any, reg: RegistrationDTO) => {
                const details = classDetails[reg.classId];
                return details ? details.startTime : "Loading...";
            },
        },
        {
            title: "End Time",
            key: "endTime",
            render: (_: any, reg: RegistrationDTO) => {
                const details = classDetails[reg.classId];
                return details ? details.endTime : "Loading...";
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, reg: RegistrationDTO) => {
                const details = classDetails[reg.classId];
                const vacancy = details ? details.vacancy : undefined;
                if (vacancy !== undefined && vacancy >= 1) {
                    return (
                        <Button onClick={() => handleUnenroll(reg.registrationId)}>
                            Registered
                        </Button>
                    );
                }
                return null;
            },
        },
    ];

    // Waitlisted Group Columns (Group Registration ID hidden)
    const groupWaitlistedColumns = [
        {
            title: "Day",
            key: "dayOfWeek",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations[0]?.classId;
                const details = classId ? classDetails[classId] : undefined;
                return details ? details.dayOfWeek : "Loading...";
            },
        },
        {
            title: "Start Time",
            key: "startTime",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations[0]?.classId;
                const details = classId ? classDetails[classId] : undefined;
                return details ? details.startTime : "Loading...";
            },
        },
        {
            title: "End Time",
            key: "endTime",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations[0]?.classId;
                const details = classId ? classDetails[classId] : undefined;
                return details ? details.endTime : "Loading...";
            },
        },
        {
            title: "Students",
            key: "students",
            render: (_: any, record: GroupRegistration) => {
                return record.registrations.map((reg, index) => (
                    <span key={reg.registrationId}>
                        {studentNames[reg.studentId] || "Loading..."}
                        {index < record.registrations.length - 1 ? ", " : ""}
                    </span>
                ));
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations[0]?.classId;
                const details = classId ? classDetails[classId] : undefined;
                if (classId && details && details.vacancy >= record.registrations.length) {
                    const myRegistration = record.registrations.find(
                        (reg) => reg.studentId === hardCodedStudentId
                    );
                    if (myRegistration) {
                        return (
                            <Button onClick={() => handleUnenroll(myRegistration.registrationId)}>
                                Registered
                            </Button>
                        );
                    }
                }
                return null;
            },
        },
    ];

    return (
        <div style={{ padding: 24 }}>
            <Typography.Title level={2}>My Registrations</Typography.Title>
            {loading ? (
                <Spin />
            ) : (
                <>
                    {/* Registered Section */}
                    <Typography.Title level={3}>Registered</Typography.Title>
                    <Typography.Title level={4}>Individual Registrations</Typography.Title>
                    <Table
                        dataSource={registeredIndividual}
                        rowKey="registrationId"
                        columns={registeredIndividualColumns}
                        pagination={false}
                    />
                    <Typography.Title level={4} style={{ marginTop: 24 }}>
                        Group Registrations
                    </Typography.Title>
                    <Table
                        dataSource={registeredGroup}
                        rowKey="groupId"
                        columns={registeredGroupColumns}
                        pagination={false}
                    />

                    {/* Waitlisted Section */}
                    <Typography.Title level={3} style={{ marginTop: 48 }}>
                        Waitlisted
                    </Typography.Title>
                    <Typography.Title level={4}>Individual Registrations</Typography.Title>
                    <Table
                        dataSource={waitlistedIndividual}
                        rowKey="registrationId"
                        columns={individualWaitlistedColumns}
                        pagination={false}
                    />
                    <Typography.Title level={4} style={{ marginTop: 24 }}>
                        Group Registrations
                    </Typography.Title>
                    <Table
                        dataSource={waitlistedGroup}
                        rowKey="groupId"
                        columns={groupWaitlistedColumns}
                        pagination={false}
                    />
                </>
            )}
        </div>
    );
};

export default MyRegistrationPage;
