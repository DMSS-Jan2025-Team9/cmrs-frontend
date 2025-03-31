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
        // <div>
        //     <h2>Students in {decodeURIComponent(programName || "")}</h2>
        //     {students.length > 0 ? (
        //         <ul>
        //             {students.map((student) => (
        //                 <li key={student.studentFullId}>
        //                     {student.name} - {student.programName} ({student.enrolledAt})
        //                 </li>
        //             ))}
        //         </ul>
        //     ) : (
        //         <p>No students found for this program.</p>
        //     )}
        // </div>
        <div>
            <h2>Students in {decodeURIComponent(programName || "")}</h2>
            {students.length > 0 ? (
                <table border={1} cellPadding="8" cellSpacing="0" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f2f2f2" }}>
                            <th>Student ID</th>
                            <th>Name</th>
                            <th>Program</th>
                            <th>Enrolled At</th>
                        </tr>
                    </thead>
                    <tbody>
                        {students.map((student) => (
                            <tr key={student.studentFullId}>
                                <td>{student.studentFullId}</td>
                                <td>{student.name}</td>
                                <td>{student.programName}</td>
                                <td>{new Date(student.enrolledAt).toLocaleDateString()}</td> {/* Formats the date */}
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <p>No students found for this program.</p>
            )}
        </div>
    );
};

export default StudentsByProgramPage;
