import React from 'react';
import PageHeader from '../../components/layout/PageHeader';
import { HiOutlineCog } from 'react-icons/hi';
import { API_BASE_URL } from '../../utils/constants';

const config = {
    appVersion: process.env.REACT_APP_VERSION || '0.1.0',
    environment: process.env.NODE_ENV || 'development',
    apiUrl: API_BASE_URL,
};

export default function SystemConfigurationPage() {
  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Configuration"
        badgeIcon={HiOutlineCog}
        title="System Configuration"
        subtitle="Advanced system configuration options"
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Application Version</dt>
                <dd className="mt-1 text-sm text-gray-900">{config.appVersion}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Environment</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{config.environment}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">API Base URL</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono break-all">{config.apiUrl}</dd>
              </div>
            </dl>
          </div>
      </div>
    </div>
  );
}
