import React from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Avatar from '../shared/Avatar';
import { HiOutlineMail, HiOutlinePhone, HiOutlineUser, HiOutlineOfficeBuilding, HiOutlineChat } from 'react-icons/hi';
import { toast } from 'react-toastify';

const ContactAdminModal = ({ isOpen, onClose }) => {
  const adminInfo = {
    name: "Ishimwe Egide",
    email: "ishimwekwibukae@gmail.com",
    phone: "+250 780 035 482",
    role: "System Administrator",
    avatar: null, // Will use initials from Avatar component
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  const handleEmailClick = () => {
    window.location.href = `mailto:${adminInfo.email}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${adminInfo.phone.replace(/\s/g, '')}`;
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Contact System Administrator" size="md">
      <div className="space-y-6">
        {/* Admin Profile Section */}
        <div className="flex flex-col items-center text-center border-b border-gray-100 pb-6">
          <Avatar 
            name={adminInfo.name} 
            src={adminInfo.avatar} 
            size="xl" 
            className="w-20 h-20 text-2xl"
          />
          <h3 className="text-xl font-bold text-gray-900 mt-3">{adminInfo.name}</h3>
          <p className="text-sm text-primary font-medium mt-1">{adminInfo.role}</p>
          <div className="mt-2 inline-flex items-center gap-1 px-3 py-1 bg-green-50 rounded-full">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-green-600 font-medium">Active</span>
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-3">
          <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <HiOutlineMail className="w-4 h-4 text-primary" />
            Contact Information
          </p>
          
          {/* Email */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <HiOutlineMail className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Email Address</p>
                <p className="text-sm font-medium text-gray-800">{adminInfo.email}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(adminInfo.email, 'Email')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-colors"
                title="Copy email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handleEmailClick}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-colors"
                title="Send email"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <HiOutlinePhone className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-gray-500">Phone Number</p>
                <p className="text-sm font-medium text-gray-800">{adminInfo.phone}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => copyToClipboard(adminInfo.phone, 'Phone number')}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-colors"
                title="Copy phone"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
              <button
                onClick={handlePhoneClick}
                className="p-1.5 rounded-lg text-gray-400 hover:text-primary hover:bg-white transition-colors"
                title="Call"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Response Time Info */}
          <div className="mt-4 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <HiOutlineChat className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-blue-800">Response Time</p>
                <p className="text-xs text-blue-600">Typically responds within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="border-t border-gray-100 pt-4 mt-2">
          <p className="text-xs text-gray-400 text-center">
            For urgent matters, please call the phone number above.
            For system access issues, include your email and username when contacting.
          </p>
        </div>

        {/* Close Button */}
        <div className="flex justify-center">
          <Button onClick={onClose} variant="outline" className="px-6">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ContactAdminModal;
