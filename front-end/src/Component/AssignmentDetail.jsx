import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const styles = {
  mainContainer: {
    border: '1px solid #ccc',
    borderRadius: '8px',
    padding: '20px',
    backgroundColor: '#f0f5ee',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '10px',
  },
  th: {
    backgroundColor: '#ddd',
    padding: '10px',
    border: '1px solid #bbb',
  },
  td: {
    padding: '10px',
    border: '1px solid #bbb',
    textAlign: 'center',
  },
  saveButton: {
    marginTop: '10px',
    padding: '8px 16px',
    backgroundColor: '#007BFF',
    color: '#fff',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '5px',
  },
};

function AssignmentDetail() {
  const { id } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [cloData, setCloData] = useState([]);
  const [scores, setScores] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    axios.get(`http://localhost:8000/api/get_assignment_detail?assignment_id=${id}`)
        .then(response => {
            setAssignments(response.data);
            console.log("Assignments fetched:", response.data);
        })
        .catch(() => setError('Error fetching assignment details.'));
  }, [id]);

  useEffect(() => {
    if (assignments.length > 0) {
        const courseName = assignments[0].course;
        console.log("Fetching CLO data for course_name:", courseName);
        axios.get(`http://localhost:8000/api/course_clo?course_name=${courseName}`)
            .then(response => {
                if (response.data.error) {
                    setError(response.data.error);
                } else {
                    setCloData(response.data);
                }
            })
            .catch(() => setError('Error fetching course CLO data.'));
    }
  }, [assignments]);

  const handleScoreChange = (studentId, cloId, score) => {
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [cloId]: score,
      }
    }));
  };

  const handleSave = async () => {
    try {
        const dataToSave = [];
        
        // สร้าง array ของข้อมูลที่มีคะแนน
        for (const studentId in scores) {
            for (const cloId in scores[studentId]) {
                const score = scores[studentId][cloId];
                if (score) {  // ถ้ามีการกรอกคะแนน
                    dataToSave.push({
                        student_id: studentId,
                        clo_id: cloId,
                        assignment_id: assignments[0].assignment_id,
                        score: score,  // ส่งคะแนนไปด้วย
                    });
                }
            }
        }

        if (dataToSave.length > 0) {
            await axios.post('http://localhost:8000/api/save_assignment_clo', { data: dataToSave });
            alert('Data saved successfully!');
        } else {
            alert('No data entered to save.');
        }
    } catch (error) {
        console.error('Error saving data:', error);
        alert('Failed to save data.');
    }
};


  if (error) return <p>{error}</p>;
  if (!assignments.length) return <p>Loading assignment details...</p>;

  const { assignment_id, assignment_name, course } = assignments[0];

  return (
    <div style={styles.mainContainer}>
      <h2>Assignment Details</h2>
      <div>
        <h3>Assignment {assignment_id}</h3>
        <p><strong>Assignment Name:</strong> {assignment_name}</p>
        <p><strong>Course:</strong> {course}</p>
      </div>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th} rowSpan="2">ชื่อ</th>
            {cloData.map(({ clo_id, clo_code }) => (
              <th key={clo_id} style={styles.th}>
                CLO <br />
                {clo_code}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {assignments.map(({ studentid, name }) => (
            <tr key={studentid}>
              <td style={styles.td}>{name}</td>
              {cloData.map(({ clo_id }) => (
                <td key={clo_id} style={styles.td}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={scores[studentid]?.[clo_id] || ''}
                    onChange={(e) => handleScoreChange(studentid, clo_id, e.target.value)}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <button style={styles.saveButton} onClick={handleSave}>Save</button>
    </div>
  );
}

export default AssignmentDetail;
