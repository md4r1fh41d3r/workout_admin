import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  Typography,
  TextField,
  IconButton,
  Chip
} from '@mui/material';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Workout } from '../models/Workout';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const WorkoutList = () => {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [filteredWorkouts, setFilteredWorkouts] = useState<Workout[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWorkouts();
  }, []);

  useEffect(() => {
    const filtered = workouts.filter(workout => 
      workout.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      workout.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (workout.muscleGroup && workout.muscleGroup.some(group => 
        group.toLowerCase().includes(searchTerm.toLowerCase())
      ))
    );
    setFilteredWorkouts(filtered);
  }, [searchTerm, workouts]);

  const fetchWorkouts = async () => {
    try {
      const workoutsRef = collection(db, 'workouts');
      const snapshot = await getDocs(workoutsRef);
      const workoutList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Workout[];
      setWorkouts(workoutList);
      setFilteredWorkouts(workoutList);
    } catch (error) {
      console.error('Error fetching workouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    // TODO: Implement delete functionality
    console.log('Delete workout:', id);
  };

  const handleEdit = (id: string) => {
    // TODO: Implement edit functionality
    console.log('Edit workout:', id);
  };

  if (loading) {
    return <Typography>Loading workouts...</Typography>;
  }

  return (
    <Box>
      <TextField
        fullWidth
        label="Search Workouts"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Muscle Groups</TableCell>
              <TableCell>Equipment</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredWorkouts.map((workout) => (
              <TableRow key={workout.id}>
                <TableCell>{workout.name}</TableCell>
                <TableCell>{workout.type}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {workout.muscleGroup?.map((group) => (
                      <Chip key={group} label={group} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {workout.equipment?.map((item) => (
                      <Chip key={item} label={item} size="small" />
                    ))}
                  </Box>
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(workout.id)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(workout.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default WorkoutList; 