import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { Types } from 'mongoose';

export const updateProjectProgress = async (projectId: string | Types.ObjectId) => {
  try {
    const project = await Project.findById(projectId);
    if (!project) return;

    const tasks = await Task.find({ project: projectId });
    
    if (tasks.length === 0) {
      project.progress = 0;
      project.status = 'Aktif';
    } else {
      const totalProgress = tasks.reduce((sum, task) => sum + task.progress, 0);
      project.progress = Math.round(totalProgress / tasks.length);
      
      // Auto-update status based on progress
      if (project.progress === 100) {
        project.status = 'Tamamlandı';
      } else if (project.progress > 0) {
        project.status = 'Aktif';
      }
    }
    
    await project.save();
    return project;
  } catch (error) {
    console.error('Error updating project progress:', error);
    throw error;
  }
};

export const updateAllProjectsProgress = async () => {
  try {
    const projects = await Project.find({});
    for (const project of projects) {
      await updateProjectProgress(project._id as any);
    }
  } catch (error) {
    console.error('Error updating all projects progress:', error);
    throw error;
  }
};
