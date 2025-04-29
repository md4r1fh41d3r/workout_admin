import React, { useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Box, Button, TextField, Typography, Chip, Stack, MenuItem, Select, FormControl, InputLabel, CircularProgress } from '@mui/material';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, getDoc, doc } from 'firebase/firestore';
import { storage, db, auth } from '../config/firebase';
import { Workout } from '../models/Workout';
import { useAuth } from '../contexts/AuthContext';

const CreateWorkout = () => {
  const { userType, user } = useAuth();
  const [workout, setWorkout] = useState<Partial<Workout>>({
    name: '',
    description: '',
    type: '',
    muscleGroup: [],
    equipment: [],
  });
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);

  const exerciseTypes = [
    'resistance',
    'training',
    'cardio',
    'stretching'
  ];

  const muscleGroups = [
    'leg',
    'bicep',
    'triceps',
    'shoulder',
    'back',
    'ankle',
    'wrist',
    'chest',
    'core',
    'full body'
  ];

  const equipmentList = [
    'barbell',
    'dumbbell',
    'resistance band',
    'kettlebell',
    'medicine ball',
    'cable machine',
    'body weight',
    'yoga mat',
    'stability ball',
    'pull-up bar'
  ];

  useEffect(() => {
    const checkPermissions = async () => {
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('User document:', userDoc.exists() ? userDoc.data() : 'Not found');
          console.log('Current userType:', userType);
          console.log('User UID:', user.uid);
        } catch (error) {
          console.error('Error checking permissions:', error);
        }
      }
    };
    checkPermissions();
  }, [user, userType]);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'video/*': ['.mp4', '.mov', '.avi']
    },
    maxFiles: 1,
    onDrop: (acceptedFiles) => {
      setVideoFile(acceptedFiles[0]);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user?.uid) {
      setError('You must be logged in to create workouts.');
      return;
    }

    if (!userType || !['admin', 'trainer'].includes(userType)) {
      setError('You do not have permission to create workouts. Please contact an administrator.');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Double check permissions before proceeding
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        throw new Error('User document not found');
      }
      
      const userData = userDoc.data();
      if (!userData.userType || !['admin', 'trainer'].includes(userData.userType)) {
        throw new Error('Insufficient permissions');
      }

      let thumbnailUrl = '';
      if (videoFile) {
        setIsUploadingVideo(true);
        const storageRef = ref(storage, `workouts/${Date.now()}_${videoFile.name}`);
        await uploadBytes(storageRef, videoFile);
        thumbnailUrl = await getDownloadURL(storageRef);
        setIsUploadingVideo(false);
      }

      const workoutData: Workout = {
        ...workout,
        id: Date.now().toString(),
        thumbnailUrl,
        likes: 0,
        isShared: true,
        createdBy: user.uid,
        createdAt: new Date().toISOString()
      } as Workout;

      await addDoc(collection(db, 'workouts'), workoutData);
      alert('Workout created successfully!');
      setWorkout({
        name: '',
        description: '',
        type: '',
        muscleGroup: [],
        equipment: [],
      });
      setVideoFile(null);
    } catch (error) {
      console.error('Error creating workout:', error);
      setError('Failed to create workout. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  if (!userType || !['admin', 'trainer'].includes(userType)) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          Access Denied
        </Typography>
        <Typography>
          You do not have permission to create workouts. Please contact an administrator.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Create New Workout
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Workout Name"
          value={workout.name}
          onChange={(e) => setWorkout({ ...workout, name: e.target.value })}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Description"
          value={workout.description}
          onChange={(e) => setWorkout({ ...workout, description: e.target.value })}
          margin="normal"
          multiline
          rows={4}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Exercise Type</InputLabel>
          <Select
            value={workout.type}
            label="Exercise Type"
            onChange={(e) => setWorkout({ ...workout, type: e.target.value })}
            required
          >
            {exerciseTypes.map((type) => (
              <MenuItem key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Muscle Groups</InputLabel>
          <Select
            multiple
            value={workout.muscleGroup}
            label="Muscle Groups"
            onChange={(e) => setWorkout({ ...workout, muscleGroup: e.target.value as string[] })}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {muscleGroups.map((group) => (
              <MenuItem key={group} value={group}>
                {group.charAt(0).toUpperCase() + group.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Equipment</InputLabel>
          <Select
            multiple
            value={workout.equipment}
            label="Equipment"
            onChange={(e) => setWorkout({ ...workout, equipment: e.target.value as string[] })}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as string[]).map((value) => (
                  <Chip key={value} label={value} />
                ))}
              </Box>
            )}
          >
            {equipmentList.map((item) => (
              <MenuItem key={item} value={item}>
                {item.charAt(0).toUpperCase() + item.slice(1)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Box {...getRootProps()} sx={{ mt: 2, p: 3, border: '2px dashed #ccc', textAlign: 'center' }}>
          <input {...getInputProps()} />
          <Typography>
            {videoFile ? `Selected file: ${videoFile.name}` : 'Drag and drop a video file here, or click to select'}
          </Typography>
        </Box>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={uploading || isUploadingVideo}
          sx={{ mt: 2, minWidth: 120 }}
        >
          {isUploadingVideo ? (
            <CircularProgress size={24} color="inherit" />
          ) : uploading ? (
            'Creating...'
          ) : (
            'Create Workout'
          )}
        </Button>
      </form>
    </Box>
  );
};

export default CreateWorkout; 