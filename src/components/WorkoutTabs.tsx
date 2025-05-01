import React, { useState } from 'react';
import { Box, Tabs, Tab, Typography } from '@mui/material';
import WorkoutList from './WorkoutList';
import CreateWorkout from './CreateWorkout';
import BulkUpload from './BulkUpload';

function TabPanel({ children, value, index, ...other }: { 
  children?: React.ReactNode;
  index: number;
  value: number;
  [key: string]: any;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`workout-tabpanel-${index}`}
      aria-labelledby={`workout-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const WorkoutTabs = () => {
  const [value, setValue] = useState(0);

  const handleChange = (event: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={value} onChange={handleChange}>
          <Tab label="Workout List" />
          <Tab label="Upload Workout" />
          <Tab label="Bulk Upload" />
        </Tabs>
      </Box>
      <TabPanel value={value} index={0}>
        <WorkoutList />
      </TabPanel>
      <TabPanel value={value} index={1}>
        <CreateWorkout />
      </TabPanel>
      <TabPanel value={value} index={2}>
        <BulkUpload />
      </TabPanel>
    </Box>
  );
};

export default WorkoutTabs; 