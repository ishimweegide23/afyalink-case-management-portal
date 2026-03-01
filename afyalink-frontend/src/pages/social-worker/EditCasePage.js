import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import { CASE_STATUSES, CASE_PRIORITIES } from '../../utils/constants';
import { formatDateTimeForInput } from '../../utils/formatDate';
import PageHeader from '../../components/layout/PageHeader';
import { HiArrowLeft, HiOutlinePencil, HiOutlineCalendar } from 'react-icons/hi';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  beneficiaryName: yup.string().required('Beneficiary name is required'),
  status: yup.string().oneOf(Object.values(CASE_STATUSES)).required(),
  priority: yup.string().oneOf(Object.values(CASE_PRIORITIES)).required(),
  closedAt: yup.string().nullable().when('status', {
    is: 'CLOSED',
    then: () => yup.string().required('Closure date is required').test(
      'is-not-future',
      "Cannot close case on a future date. Please use today's date or earlier.",
      (value) => {
        if (!value) return false;
        return new Date(value) <= new Date();
      }
    ),
    otherwise: () => yup.string().nullable(),
  }),
});

export default function EditCasePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({ resolver: yupResolver(schema) });

  const status = watch('status');

  useEffect(() => {
    async function fetchCase() {
      try {
        const res = await caseApi.getById(id);
        const c = res?.data || res || {};
        reset({
          title: c.title || '',
          beneficiaryName: c.beneficiaryName || '',
          beneficiaryIdentifier: c.beneficiaryIdentifier || '',
          status: c.status || 'OPEN',
          priority: c.priority || 'MEDIUM',
          closedAt: formatDateTimeForInput(c.closedAt) || '',
          nextFollowUpDate: c.nextFollowUpDate || '',
        });
      } catch { toast.error('Failed to load case'); }
      finally { setFetching(false); }
    }
    fetchCase();
  }, [id, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        title: data.title,
        beneficiaryName: data.beneficiaryName,
        beneficiaryIdentifier: data.beneficiaryIdentifier || null,
        status: data.status,
        closedAt: data.status === 'CLOSED' ? (data.closedAt ? (data.closedAt.length === 16 ? data.closedAt + ':00' : data.closedAt) : new Date().toISOString()) : null,
        priority: data.priority,
        nextFollowUpDate: data.nextFollowUpDate || null,
      };
      await caseApi.update(id, payload);
      toast.success('Case updated successfully');
      navigate('/social-worker/cases');
    } catch (err) {
      toast.error(err?.message || err.response?.data?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Cases
      </button>
      <PageHeader badge="Edit Case" badgeIcon={HiOutlinePencil} title="Update Case" subtitle="Changes will sync across interventions and schedule" />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Case Title *" register={register('title')} error={errors.title?.message} />
            <Input label="Beneficiary Name *" register={register('beneficiaryName')} error={errors.beneficiaryName?.message} />
            <Input label="Beneficiary Identifier" register={register('beneficiaryIdentifier')} placeholder="National ID, passport, or reference number" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Status *" register={register('status')} error={errors.status?.message}
                options={Object.values(CASE_STATUSES).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
              <Select label="Priority *" register={register('priority')} error={errors.priority?.message}
                options={Object.values(CASE_PRIORITIES).map((p) => ({ value: p, label: p }))} />
            </div>
            {status === 'CLOSED' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><HiOutlineCalendar className="w-4 h-4 text-gray-400" /> Case Closure Date & Time *</span>
                </label>
                <input type="datetime-local" {...register('closedAt')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
                {errors.closedAt && <p className="text-xs text-red-500 mt-1">{errors.closedAt.message}</p>}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <span className="flex items-center gap-1.5"><HiOutlineCalendar className="w-4 h-4 text-gray-400" /> Next Follow-up Date</span>
              </label>
              <input type="date" {...register('nextFollowUpDate')} className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary" />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Save Changes</Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
