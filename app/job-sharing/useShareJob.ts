import { useState } from 'react';
import { Share, Platform } from 'react-native';

const API_URL = 'https://buez-server-khaki.vercel.app'; 

interface ShareJobData {
  jobId: string;
  jobTitle: string;
  jobDescription?: string;
  companyName?: string;
}

interface ShareResponse {
  success: boolean;
  shareUrl: string;
  shortCode: string;
}

export const useShareJob = () => {
  const [isSharing, setIsSharing] = useState(false);

  const shareJob = async (data: ShareJobData) => {
    try {
      setIsSharing(true);

      // Create share link via API
      const response = await fetch(`${API_URL}/api/share`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      console.log("response.............",response)

      if (!response.ok) {
        throw new Error('Failed to create share link');
      }

      const result: ShareResponse = await response.json();
      console.log("result.............",result)

      // Share via native share dialog
      const shareMessage = Platform.select({
        ios: `Check out this job on Buez: ${data.jobTitle}\n\n${result.shareUrl}`,
        android: `Check out this job on Buez: ${data.jobTitle}\n\n${result.shareUrl}`,
        default: `Check out this job: ${data.jobTitle}\n${result.shareUrl}`,
      });

      const shareResult = await Share.share(
        {
          message: shareMessage,
          url: result.shareUrl, // iOS uses this
          title: data.jobTitle,
        },
        {
          dialogTitle: 'Share Job',
          subject: `Job: ${data.jobTitle}`, // Email subject
        }
      );

      if (shareResult.action === Share.sharedAction) {
        console.log('Shared.............', shareResult);
        return { success: true, platform: shareResult.activityType };
      } else if (shareResult.action === Share.dismissedAction) {
        console.log('Share dismissed');
        return { success: false, dismissed: true };
      }

      return { success: false };
    } catch (error) {
      console.error('Share error:', error);
      return { success: false, error };
    } finally {
      setIsSharing(false);
    }
  };

  return { shareJob, isSharing };
};
