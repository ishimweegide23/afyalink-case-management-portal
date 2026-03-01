import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import { useAuth } from '../../context/AuthContext';
import { USER_ROLES } from '../../utils/constants';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/layout/PageHeader';
import PriorityBadge from '../../components/shared/PriorityBadge';
import { formatDate } from '../../utils/formatDate';
import {
  HiArrowLeft, HiOutlinePencil, HiOutlineClipboardList, HiOutlineFolder,
  HiOutlineUser, HiOutlineCalendar, HiOutlineDocumentText,
} from 'react-icons/hi';

export default function CaseDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isSW = user?.role === USER_ROLES.SOCIAL_WORKER;
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try { const res = await caseApi.getById(id); setCaseData(res?.data); }
      catch { toast.error('Failed to load case'); }
      finally { setLoading(false); }
    }
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!caseData) return <p className="text-center text-gray-500 py-20">Case not found</p>;

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Cases
      </button>
      <PageHeader
        badge={caseData.caseNumber || 'Case'}
        badgeIcon={HiOutlineFolder}
        title={caseData.title}
        subtitle={`${caseData.beneficiaryName || 'Beneficiary'} • ${caseData.status}`}
        action={isSW && (
          <div className="flex gap-2">
            <Link to={`/social-worker/cases/${id}/edit`}>
              <Button variant="outline" size="sm" className="bg-white/20 border-white/40 text-white hover:bg-white/30"><HiOutlinePencil className="w-4 h-4 mr-1" />Edit</Button>
            </Link>
            <Link to={`/social-worker/cases/${id}/entries`}>
              <Button variant="outline" size="sm" className="bg-white/20 border-white/40 text-white hover:bg-white/30"><HiOutlineClipboardList className="w-4 h-4 mr-1" />Entries</Button>
            </Link>
          </div>
        )}
      />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <StatusBadge status={caseData.status} />
            <PriorityBadge priority={caseData.priority} />
          </div>

          {caseData.description && (
            <p className="text-gray-600 mb-6">{caseData.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Beneficiary', value: caseData.beneficiaryName || '—', icon: HiOutlineUser },
              { label: 'Assigned To', value: caseData.assignedSocialWorker?.fullName || caseData.assignedSocialWorker?.email || '—', icon: HiOutlineUser },
              { label: 'Created', value: formatDate(caseData.createdAt), icon: HiOutlineCalendar },
              { label: 'Updated', value: formatDate(caseData.updatedAt), icon: HiOutlineCalendar },
              { label: 'Opened', value: caseData.openedAt ? formatDate(caseData.openedAt) : '—', icon: HiOutlineCalendar },
              { label: 'Closed', value: caseData.closedAt ? formatDate(caseData.closedAt) : '—', icon: HiOutlineCalendar },
              { label: 'Next Follow-up', value: caseData.nextFollowUpDate ? formatDate(caseData.nextFollowUpDate) : '—', icon: HiOutlineCalendar },
              { label: 'Progress', value: caseData.progressPercent != null ? `${caseData.progressPercent}%` : '—', icon: HiOutlineDocumentText },
            ].map((item) => (
              <div key={item.label} className="bg-gray-50/80 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-medium mb-1">
                  <item.icon className="w-4 h-4" /> {item.label}
                </div>
                <p className="font-medium text-gray-900 text-sm">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
