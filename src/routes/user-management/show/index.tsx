import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export const StudentsByProgramPage: React.FC = () => {
    const { programName } = useParams<{ programName: string }>();
    const [students, setStudents] = useState<any[]>([]); // Ensure it's an array
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchStudents = async () => {
            if (!programName) {
                setError("Program name is missing.");
                setLoading(false);
                return;
            }

            try {
                const encodedProgramName = encodeURIComponent(programName);
                const response = await axios.get(`http://localhost:8085/api/students/program/${encodedProgramName}`);
                setStudents(response.data || []);
            } catch (err) {
                console.error("Failed to fetch students:", err);
                setError("Failed to fetch students.");
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [programName]);

    if (loading) return <p>Loading students...</p>;
    if (error) return <p>{error}</p>;

    return (
        <div>
            <h2>Students in {decodeURIComponent(programName || "")}</h2>
            {students.length > 0 ? (
                <ul>
                    {students.map((student) => (
                        <li key={student.studentFullId}>
                            {student.name} - {student.programName} ({student.enrolledAt})
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No students found for this program.</p>
            )}
        </div>
    );
};

export default StudentsByProgramPage;
