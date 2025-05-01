import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Alert
} from '@mui/material';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { collection, addDoc } from 'firebase/firestore';
import { storage, db } from '../config/firebase';
import { Workout } from '../models/Workout';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';

const BulkUpload = () => {
  const [csvData, setCsvData] = useState<{
    name: string;
    description: string;
    type: string;
    muscleGroup: string;
    equipment: string;
    videoFileName: string;
  }[]>([]);
  const [videoFiles, setVideoFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const template = `name,description,type,muscleGroup,equipment,videoFileName
Barbell Back Squat,"To perform a barbell back squat...",resistance,"legs;quads;glutes;core","barbell;squat rack",barbell_back_squat.mp4
Barbell Sumo Squat,"To perform a barbell sumo squat...",resistance,"legs;quads;glutes;adductors;hamstrings","barbell;squat rack",barbell_sumo_squat.mp4
Barbell Split Squat,"To perform a barbell split squat...",resistance,"legs;quads;glutes;hamstrings","barbell",barbell_split_squat.mp4`;

    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workout_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const rows = text.split('\n');
        const headers = rows[0].split(',').map(h => h.trim());
        
        // Validate headers
        const requiredHeaders = ['name', 'description', 'type', 'muscleGroup', 'equipment', 'videoFileName'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        
        if (missingHeaders.length > 0) {
          setError(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        const data = rows.slice(1).map((row, index) => {
          const values = row.split(',').map(v => v.trim());
          return {
            name: values[headers.indexOf('name')] || '',
            description: values[headers.indexOf('description')] || '',
            type: values[headers.indexOf('type')] || '',
            muscleGroup: values[headers.indexOf('muscleGroup')] || '',
            equipment: values[headers.indexOf('equipment')] || '',
            videoFileName: values[headers.indexOf('videoFileName')] || ''
          };
        }).filter(row => row.name); // Filter out empty rows

        setCsvData(data);
        setError(null);
      } catch (err) {
        setError('Error parsing CSV file. Please check the format and try again.');
      }
    };
    reader.readAsText(file);
  };

  const handleVideoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setVideoFiles(files);
  };

  const handleBulkUpload = async () => {
    if (!csvData.length || !videoFiles.length) {
      alert('Please upload both CSV and video files');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const totalItems = csvData.length;
      let processedItems = 0;

      for (const row of csvData) {
        const videoFile = videoFiles.find(file => file.name === row.videoFileName);
        if (!videoFile) {
          console.error(`Video file not found for workout: ${row.name}`);
          continue;
        }

        // Upload video
        const videoRef = ref(storage, `workouts/${Date.now()}_${videoFile.name}`);
        await uploadBytes(videoRef, videoFile);
        const videoUrl = await getDownloadURL(videoRef);

        // Create workout
        const workout: Workout = {
          id: Date.now().toString(),
          name: row.name,
          description: row.description,
          type: row.type,
          muscleGroup: row.muscleGroup.split(';').map(g => g.trim()),
          equipment: row.equipment.split(';').map(e => e.trim()),
          thumbnailUrl: videoUrl,
          likes: 0,
          isShared: true,
          createdAt: new Date().toISOString()
        };

        await addDoc(collection(db, 'workouts'), workout);

        processedItems++;
        setProgress((processedItems / totalItems) * 100);
      }

      alert('Bulk upload completed successfully!');
      setCsvData([]);
      setVideoFiles([]);
    } catch (error) {
      console.error('Error during bulk upload:', error);
      alert('Error during bulk upload. Please check the console for details.');
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Bulk Upload Workouts
      </Typography>
      
      <Box sx={{ mb: 3 }}>
        <Button
          variant="outlined"
          startIcon={<DownloadIcon />}
          onClick={downloadTemplate}
          sx={{ mr: 2 }}
        >
          Download Template
        </Button>

        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ mr: 2 }}
        >
          Upload CSV
          <input
            type="file"
            hidden
            accept=".csv"
            onChange={handleCSVUpload}
          />
        </Button>

        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUploadIcon />}
          sx={{ mr: 2 }}
        >
          Upload Videos
          <input
            type="file"
            hidden
            multiple
            accept="video/*"
            onChange={handleVideoUpload}
          />
        </Button>

        <Button
          variant="contained"
          color="primary"
          onClick={handleBulkUpload}
          disabled={uploading || !csvData.length || !videoFiles.length}
        >
          {uploading ? (
            <>
              <CircularProgress size={24} sx={{ mr: 1 }} />
              Uploading... ({Math.round(progress)}%)
            </>
          ) : (
            'Start Upload'
          )}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {csvData.length > 0 && (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Muscle Groups</TableCell>
                <TableCell>Equipment</TableCell>
                <TableCell>Video File</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {csvData.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.type}</TableCell>
                  <TableCell>{row.muscleGroup}</TableCell>
                  <TableCell>{row.equipment}</TableCell>
                  <TableCell>
                    {videoFiles.some(file => file.name === row.videoFileName) ? (
                      <Typography color="success.main">✓</Typography>
                    ) : (
                      <Typography color="error.main">Missing</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
};

export default BulkUpload; 