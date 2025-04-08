
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface DashboardFooterProps {
  isManager: boolean;
}

const DashboardFooter: React.FC<DashboardFooterProps> = ({ isManager }) => {
  const navigate = useNavigate();

  if (!isManager) {
    return null;
  }

  return (
    <div className="flex justify-center pt-4">
      <Button
        variant="outline"
        onClick={() => navigate('/device-management')}
        className="flex items-center gap-2"
      >
        Go to Device Management
        <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

export default DashboardFooter;
