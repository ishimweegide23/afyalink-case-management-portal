import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import { caseApi } from '../../api/caseApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import { INTERVENTION_TYPES, CASE_PRIORITIES } from '../../utils/constants';
import { formatEnum } from '../../utils/helpers';
import PageHeader from '../../components/layout/PageHeader';
import { HiArrowLeft, HiOutlineClipboardList } from 'react-icons/hi';

const CATEGORIES = [
  'Social Support', 'Healthcare', 'Academic Support',
  'Psychosocial Support', 'Vocational', 'Crisis Support',
];

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  type: yup.string().oneOf(Object.values(INTERVENTION_TYPES)).required('Type is required'),
  caseId: yup.number().required('Case is required').typeError('Select a case'),
  plannedStartDatetime: yup.string().required('Start date/time is required'),
  plannedEndDatetime: yup.string().nullable(),
  priority: yup.string().oneOf(Object.values(CASE_PRIORITIES)).nullable(),
  category: yup.string().nullable(),
  location: yup.string().nullable(),
  durationMinutes: yup.number().nullable().typeError('Must be a number'),
  outcomesPlanned: yup.string().nullable(),
  resources: yup.string().nullable(),
});

export default function CreateInterventionPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [cases, setCases] = useState([]);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { type: 'HOME_VISIT', priority: 'MEDIUM' },
  });

  useEffect(() => {
    async function loadCases() {
      try {
        const res = await caseApi.getAll({ page: 0, size: 500 });
        const payload = res?.data !== undefined ? res.data : res;
        setCases(Array.isArray(payload?.content) ? payload.content : []);
      } catch { /* silent */ }
    }
    loadCases();
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        plannedStartDatetime: data.plannedStartDatetime ? data.plannedStartDatetime + ':00' : null,
        plannedEndDatetime: data.plannedEndDatetime ? data.plannedEndDatetime + ':00' : null,
        durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes) : null,
      };
      await interventionApi.create(payload);
      toast.success('Intervention created');
      navigate('/social-worker/interventions');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Interventions
      </button>
      <PageHeader badge="New Intervention" badgeIcon={HiOutlineClipboardList} title="Create Intervention" subtitle="Plan a new intervention for a case. A matching task is created (due on the planned date) so Schedule, Field Work, and case progress stay aligned." />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Title" register={register('title')} error={errors.title?.message} placeholder="Intervention title" />
            <Select
              label="Case"
              register={register('caseId')}
              error={errors.caseId?.message}
              options={cases.map((c) => ({ value: c.id, label: `${c.caseNumber || c.id} - ${c.title}` }))}
              placeholder="Select case"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type" register={register('type')} error={errors.type?.message}
                options={Object.values(INTERVENTION_TYPES).map((t) => ({ value: t, label: formatEnum(t) }))} />
              <Select label="Priority" register={register('priority')}
                options={Object.values(CASE_PRIORITIES).map((p) => ({ value: p, label: formatEnum(p) }))} />
            </div>
            <Select label="Category" register={register('category')}
              options={CATEGORIES.map((c) => ({ value: c, label: c }))} placeholder="Select category" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Start Date & Time" type="datetime-local" register={register('plannedStartDatetime')} error={errors.plannedStartDatetime?.message} />
              <Input label="End Date & Time" type="datetime-local" register={register('plannedEndDatetime')} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Duration (minutes)" type="number" register={register('durationMinutes')} placeholder="e.g., 120" />
              <Input label="Location" register={register('location')} placeholder="Location (optional)" />
            </div>
            <Textarea label="Description" register={register('description')} error={errors.description?.message} rows={4} placeholder="Describe the intervention" />
            <Textarea label="Expected Outcomes" register={register('outcomesPlanned')} rows={3} placeholder="List expected outcomes..." />
            <Textarea label="Resources Needed" register={register('resources')} rows={2} placeholder="Transportation, supplies..." />
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading}>Create Intervention</Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
