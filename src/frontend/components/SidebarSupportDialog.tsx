import React from 'react';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { HelpCircle } from 'lucide-react';
import SupportForm from './support/SupportForm';
import { useUser } from '@/lib/useUserData';

const SidebarSupportDialog: React.FC = () => {
  const { user } = useUser();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 rounded transition">
          <HelpCircle className="w-5 h-5 mr-2" />
          <span>Support</span>
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Contact Support</DialogTitle>
          <DialogDescription>Submit a support ticket and our team will get back to you via email.</DialogDescription>
        </DialogHeader>
        <SupportForm userEmail={user?.email} />
        <DialogFooter>
          <DialogClose asChild>
            <button className="mt-4 px-4 py-2 bg-gray-200 rounded">Close</button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SidebarSupportDialog;
