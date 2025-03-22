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

export const MyRegistrationPage: React.FC = () => {
    const [loading, setLoading] = useState<boolean>(false);
    // Registered data
    const [registeredIndividual, setRegisteredIndividual] = useState<RegistrationDTO[]>([]);
    const [registeredGroup, setRegisteredGroup] = useState<GroupRegistration[]>([]);
    // Waitlisted data
    const [waitlistedIndividual, setWaitlistedIndividual] = useState<RegistrationDTO[]>([]);
    const [waitlistedGroup, setWaitlistedGroup] = useState<GroupRegistration[]>([]);
    // Caches for student names and class vacancies
    const [studentNames, setStudentNames] = useState<{ [key: number]: string }>({});
    const [classVacancies, setClassVacancies] = useState<{ [key: number]: number }>({});

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

                // For registered, split into individual and group registrations
                setRegisteredIndividual(registered.filter((reg) => !reg.groupRegistrationId));
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

                // For waitlisted, split into individual and group registrations
                setWaitlistedIndividual(waitlisted.filter((reg) => !reg.groupRegistrationId));
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

    // Fetch vacancy for each class in waitlisted registrations
    useEffect(() => {
        const classIdsToFetch = new Set<number>();
        waitlistedIndividual.forEach((reg) => {
            if (!classVacancies[reg.classId]) {
                classIdsToFetch.add(reg.classId);
            }
        });
        waitlistedGroup.forEach((group) => {
            const classId = group.registrations[0]?.classId;
            if (classId && !classVacancies[classId]) {
                classIdsToFetch.add(classId);
            }
        });
        classIdsToFetch.forEach((classId) => {
            fetch(`http://localhost:8081/api/classes/${classId}`)
                .then((res) => res.json())
                .then((data) => {
                    // Assume data has a "vacancy" property
                    setClassVacancies((prev) => ({ ...prev, [classId]: data.vacancy }));
                })
                .catch((err) =>
                    console.error("Error fetching class vacancy:", err)
                );
        });
    }, [waitlistedIndividual, waitlistedGroup, classVacancies]);

    // Update functions for waitlisted registrations
    const handleIndividualRegister = (registrationId: number) => {
        fetch(`http://localhost:8083/api/courseRegistration/individual/${registrationId}?newStatus=Registered`, {
            method: "PUT",
        })
            .then((response) => {
                if (response.ok) {
                    message.success("Individual registration updated successfully");
                    // Optionally, refresh or update state here
                } else {
                    message.error("Failed to update individual registration");
                }
            })
            .catch((error) => {
                console.error(error);
                message.error("Error updating individual registration");
            });
    };

    const handleGroupRegister = (groupRegistrationId: number) => {
        fetch(`http://localhost:8083/api/courseRegistration/group/${groupRegistrationId}?newStatus=Registered`, {
            method: "PUT",
        })
            .then((response) => {
                if (response.ok) {
                    message.success("Group registration updated successfully");
                    // Optionally, refresh or update state here
                } else {
                    message.error("Failed to update group registration");
                }
            })
            .catch((error) => {
                console.error(error);
                message.error("Error updating group registration");
            });
    };

    // Columns for Registered sections (no action button needed)
    const registeredIndividualColumns = [
        {
            title: "Registration ID",
            dataIndex: "registrationId",
            key: "registrationId",
        },
        {
            title: "Class ID",
            dataIndex: "classId",
            key: "classId",
        },
    ];

    const registeredGroupColumns = [
        {
            title: "Group Registration ID",
            dataIndex: "groupId",
            key: "groupId",
        },
        {
            title: "Class ID",
            key: "classId",
            render: (_: any, record: GroupRegistration) =>
                record.registrations.length > 0 ? record.registrations[0].classId : "N/A",
        },
        {
            title: "Students",
            key: "students",
            render: (_: any, record: GroupRegistration) => {
                const names = record.registrations.map(
                    (reg) => studentNames[reg.studentId] || "Loading..."
                );
                return names.join(", ");
            },
        },
    ];

    // Columns for Waitlisted sections (with Registered action button if vacancy permits)
    const individualWaitlistedColumns = [
        {
            title: "Registration ID",
            dataIndex: "registrationId",
            key: "registrationId",
        },
        {
            title: "Class ID",
            dataIndex: "classId",
            key: "classId",
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, reg: RegistrationDTO) => {
                const vacancy = classVacancies[reg.classId];
                if (vacancy !== undefined && vacancy >= 1) {
                    return (
                        <Button onClick={() => handleIndividualRegister(reg.registrationId)}>
                            Registered
                        </Button>
                    );
                }
                return null;
            },
        },
    ];

    const groupWaitlistedColumns = [
        {
            title: "Group Registration ID",
            dataIndex: "groupId",
            key: "groupId",
        },
        {
            title: "Class ID",
            key: "classId",
            render: (_: any, record: GroupRegistration) =>
                record.registrations.length > 0 ? record.registrations[0].classId : "N/A",
        },
        {
            title: "Students",
            key: "students",
            render: (_: any, record: GroupRegistration) => {
                const names = record.registrations.map(
                    (reg) => studentNames[reg.studentId] || "Loading..."
                );
                return names.join(", ");
            },
        },
        {
            title: "Action",
            key: "action",
            render: (_: any, record: GroupRegistration) => {
                const classId = record.registrations.length > 0 ? record.registrations[0].classId : undefined;
                if (
                    classId !== undefined &&
                    classVacancies[classId] !== undefined &&
                    classVacancies[classId] >= record.registrations.length
                ) {
                    return (
                        <Button onClick={() => handleGroupRegister(record.groupId)}>
                            Registered
                        </Button>
                    );
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
