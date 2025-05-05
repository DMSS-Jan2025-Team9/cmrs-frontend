import React, { useEffect, useState } from "react";
import { Table, Button } from "antd";
import { useNavigate } from "react-router-dom";
import { Course, ClassSchedule } from "@/models";
import { logError } from "@/utilities/logger";

const { Column } = Table;

export const CourseClassList: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [classesMap, setClassesMap] = useState<{ [courseId: number]: ClassSchedule[] }>({});
    const [loading, setLoading] = useState<boolean>(false);

    const navigate = useNavigate();

    // Fetch courses from the specified URL
    useEffect(() => {
        setLoading(true);
        fetch("http://localhost:8081/api/courses/getActiveCourses")
            .then((res) => res.json())
            .then((data: Course[]) => {
                setCourses(data);
                setLoading(false);
            })
            .catch((err) => {
                logError("Error fetching courses:", err);
                setLoading(false);
            });
    }, []);

    // Fetch classes for a given course if not already loaded
    const fetchClassesForCourse = async (courseId: number) => {
        if (classesMap[courseId]) return;
        try {
            const res = await fetch(`http://localhost:8081/api/classSchedule?courseId=${courseId}`);
            const data: ClassSchedule[] = await res.json();
            setClassesMap((prev) => ({ ...prev, [courseId]: data }));
        } catch (error) {
            logError("Error fetching classes:", error);
        }
    };

    return (
        <div>
            <div style={{ marginBottom: 16 }}>
                <Button
                    type="primary"
                    onClick={() => navigate("/courseRegistration/myRegistration")}
                >
                    My Registration
                </Button>
            </div>
            <Table
                dataSource={courses}
                rowKey="courseId"
                loading={loading}
                expandable={{
                    expandedRowRender: (record: Course) => {
                        // Fetch classes when a course row is expanded
                        fetchClassesForCourse(record.courseId!);
                        const classesData = classesMap[record.courseId!];
                        return classesData ? (
                            <Table
                                dataSource={classesData}
                                rowKey="classId"
                                pagination={false}
                                size="small"
                            >
                                <Column title="Day" dataIndex="dayOfWeek" key="dayOfWeek" />
                                <Column title="Start Time" dataIndex="startTime" key="startTime" />
                                <Column title="End Time" dataIndex="endTime" key="endTime" />
                                <Column title="Capacity" dataIndex="maxCapacity" key="maxCapacity" />
                                <Column title="Vacancy" dataIndex="vacancy" key="vacancy" />
                                <Column
                                    title="Action"
                                    key="action"
                                    render={(_: any, cls: ClassSchedule) => (
                                        <>
                                            <Button
                                                type="primary"
                                                onClick={() =>
                                                    navigate(`/courseRegistration/new/${cls.classId}`)
                                                }
                                            >
                                                Register
                                            </Button>
                                        </>
                                    )}
                                />
                            </Table>
                        ) : (
                            <p>Loading classes...</p>
                        );
                    },
                    onExpand: (expanded, record: Course) => {
                        if (expanded) {
                            fetchClassesForCourse(record.courseId!);
                        }
                    },
                }}
            >
                <Column title="Course Name" dataIndex="courseName" key="courseName" />
                <Column title="Course Code" dataIndex="courseCode" key="courseCode" />
                <Column title="Description" dataIndex="courseDesc" key="courseDesc" />
            </Table>
        </div>
    );
};

export default CourseClassList;
