import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import Spinner from '../../components/common/Spinner';
import StatusBadge from '../../components/shared/StatusBadge';
import PriorityBadge from '../../components/shared/PriorityBadge';
import { formatDate } from '../../utils/formatDate';
import PageHeader from '../../components/layout/PageHeader';
import {
  HiArrowLeft,
  HiOutlineDocumentText,
  HiOutlineUser,
  HiOutlineCalendar,
  HiOutlineClipboardList,
  HiOutlineFolder,
} from 'react-icons/hi';

export default function AdminCaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await caseApi.getById(id);
        const payload = res?.data !== undefined ? res.data : res;
        setCaseData(payload);
      } catch {
        toast.error('Failed to load case');
      } finally {
        setLoading(false);
      }
    }
    fetchCase();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }
  if (!caseData) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Case not found</p>
        <button onClick={() => navigate('/admin/cases')} className="text-primary font-medium hover:underline">Back to cases</button>
      </div>
    );
  }

  const assignedName = caseData.assignedSocialWorker?.fullName || caseData.assignedSocialWorker?.email || '—';
  const createdByName = caseData.createdBy?.fullName || caseData.createdBy?.email || '—';
  const supervisorName = caseData.assignedSocialWorkerSupervisorName;

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <PageHeader
        badge={caseData.caseNumber}
        badgeIcon={HiOutlineFolder}
        title={caseData.title}
        subtitle={`${caseData.status || ''} ${caseData.priority ? `• ${caseData.priority}` : ''}`.trim()}
        action={
          <button onClick={() => navigate('/admin/cases')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors">
            <HiArrowLeft className="w-4 h-4" /> Back to cases
          </button>
        }
      />
      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <StatusBadge status={caseData.status} />
          <PriorityBadge priority={caseData.priority} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Beneficiary', value: caseData.beneficiaryName || '—', icon: HiOutlineUser },
              { label: 'Identifier', value: caseData.beneficiaryIdentifier || '—', icon: HiOutlineDocumentText },
              { label: 'Social Worker', value: assignedName, icon: HiOutlineUser },
              { label: 'Supervisor', value: supervisorName || '—', icon: HiOutlineUser },
              { label: 'Created by', value: createdByName, icon: HiOutlineUser },
              { label: 'Opened', value: caseData.openedAt ? formatDate(caseData.openedAt) : '—', icon: HiOutlineCalendar },
              { label: 'Closed', value: caseData.closedAt ? formatDate(caseData.closedAt) : '—', icon: HiOutlineCalendar },
              { label: 'Next follow-up', value: caseData.nextFollowUpDate ? formatDate(caseData.nextFollowUpDate) : '—', icon: HiOutlineCalendar },
              { label: 'Progress', value: caseData.progressPercent != null ? `${caseData.progressPercent}%` : '—', icon: HiOutlineClipboardList },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <item.icon className="w-4 h-4" /> {item.label}
                </div>
                <p className="font-medium text-gray-900 text-sm">{item.value}</p>
              </div>
            ))}
          </div>

        <div className="mt-6 pt-6 border-t border-gray-100 flex flex-wrap gap-2 text-xs text-gray-400">
          <span>Created: {formatDate(caseData.createdAt)}</span>
          <span>Updated: {formatDate(caseData.updatedAt)}</span>
        </div>
      </div>
    </div>
  );
}
