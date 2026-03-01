import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import Spinner from '../../components/common/Spinner';
import Button from '../../components/common/Button';
import StatusBadge from '../../components/shared/StatusBadge';
import PageHeader from '../../components/layout/PageHeader';
import PriorityBadge from '../../components/shared/PriorityBadge';
import { formatDate } from '../../utils/formatDate';
import { formatEnum } from '../../utils/helpers';
import {
  HiArrowLeft, HiOutlinePencil, HiOutlineClipboardList,
  HiOutlineCalendar, HiOutlineLocationMarker, HiOutlineLightningBolt,
} from 'react-icons/hi';

export default function InterventionDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      try { const res = await interventionApi.getById(id); setData(res?.data); }
      catch { toast.error('Failed to load'); }
      finally { setLoading(false); }
    }
    fetch();
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;
  if (!data) return <p className="text-center text-gray-500 py-20">Intervention not found</p>;

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Interventions
      </button>
      <PageHeader
        badge={data.interventionCode || 'Intervention'}
        badgeIcon={HiOutlineClipboardList}
        title={data.title}
        subtitle={`${formatEnum(data.type)} • ${data.status}`}
        action={
          <Link to={`/social-worker/interventions/${id}/edit`}>
            <Button variant="outline" size="sm" className="bg-white/20 border-white/40 text-white hover:bg-white/30"><HiOutlinePencil className="w-4 h-4 mr-1" />Edit</Button>
          </Link>
        }
      />
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <StatusBadge status={data.status} />
            {data.priority && <PriorityBadge priority={data.priority} />}
            <span className="text-sm text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-lg">{formatEnum(data.type)}</span>
          </div>

          {data.description && (
            <p className="text-gray-600 mb-6">{data.description}</p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Scheduled Start', value: formatDate(data.plannedStartDatetime), icon: HiOutlineCalendar },
              { label: 'Scheduled End', value: data.plannedEndDatetime ? formatDate(data.plannedEndDatetime) : '—', icon: HiOutlineCalendar },
              { label: 'Location', value: data.location || '—', icon: HiOutlineLocationMarker },
              { label: 'Created', value: formatDate(data.createdAt), icon: HiOutlineCalendar },
              { label: 'Updated', value: formatDate(data.updatedAt), icon: HiOutlineCalendar },
              { label: 'Effectiveness', value: data.effectivenessPercent != null ? `${data.effectivenessPercent}%` : '—', icon: HiOutlineLightningBolt },
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
