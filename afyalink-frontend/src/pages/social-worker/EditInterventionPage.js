import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { interventionApi } from '../../api/interventionApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import { INTERVENTION_TYPES, INTERVENTION_STATUSES, CASE_PRIORITIES } from '../../utils/constants';
import { formatDateTimeForInput } from '../../utils/formatDate';
import PageHeader from '../../components/layout/PageHeader';
import { HiArrowLeft, HiOutlinePencil, HiOutlineSave } from 'react-icons/hi';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().required('Description is required'),
  type: yup.string().oneOf(Object.values(INTERVENTION_TYPES)).required('Type is required'),
  status: yup.string().oneOf(Object.values(INTERVENTION_STATUSES)).required('Status is required'),
  priority: yup.string().oneOf(Object.values(CASE_PRIORITIES)).nullable(),
  location: yup.string().nullable(),
  plannedStartDatetime: yup.string().nullable(),
  plannedEndDatetime: yup.string().nullable(),
  durationMinutes: yup.number().nullable().integer().min(0),
  completedAt: yup.string().nullable().when('status', {
    is: 'COMPLETED',
    then: () => yup.string().required('Completion date is required').test(
      'is-not-future',
      "Cannot complete intervention on a future date. Please use today's date or earlier.",
      (value) => {
        if (!value) return false;
        return new Date(value) <= new Date();
      }
    ),
    otherwise: () => yup.string().nullable(),
  }),
  effectivenessPercent: yup.number().nullable()
    .transform((value, originalValue) => originalValue === '' ? null : value)
    .min(0).max(100).integer()
    .when('status', {
      is: (statusVal) => statusVal !== 'COMPLETED',
      then: () => yup.number().nullable()
        .transform((value, originalValue) => originalValue === '' ? null : value)
        .test(
          'no-effectiveness',
          'Cannot set effectiveness percentage without completing the intervention.',
          (value) => value == null || isNaN(value)
        ),
    }),
  effectivenessStarRating: yup.number().nullable().min(1).max(5).integer(),
  completionNotes: yup.string().nullable(),
  outcomesPlanned: yup.string().nullable(),
  outcomesActual: yup.string().nullable(),
  resources: yup.string().nullable(),
});

export default function EditInterventionPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { status: 'PLANNED' },
  });

  const status = watch('status');

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await interventionApi.getById(id);
        const intervention = res?.data ?? res;
        if (intervention) {
          reset({
            title: intervention.title ?? '',
            description: intervention.description ?? '',
            type: intervention.type ?? 'HOME_VISIT',
            status: intervention.status ?? 'PLANNED',
            priority: intervention.priority ?? '',
            location: intervention.location ?? '',
            plannedStartDatetime: formatDateTimeForInput(intervention.plannedStartDatetime) || '',
            plannedEndDatetime: formatDateTimeForInput(intervention.plannedEndDatetime) || '',
            completedAt: formatDateTimeForInput(intervention.completedAt) || '',
            durationMinutes: intervention.durationMinutes ?? '',
            effectivenessPercent: intervention.effectivenessPercent ?? '',
            effectivenessStarRating: intervention.effectivenessStarRating ?? '',
            completionNotes: intervention.completionNotes ?? '',
            outcomesPlanned: intervention.outcomesPlanned ?? '',
            outcomesActual: intervention.outcomesActual ?? '',
            resources: intervention.resources ?? '',
          });
        }
      } catch {
        toast.error('Failed to load intervention');
      } finally {
        setFetching(false);
      }
    }
    fetchData();
  }, [id, reset]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        ...data,
        plannedStartDatetime: data.plannedStartDatetime ? (data.plannedStartDatetime.length === 16 ? data.plannedStartDatetime + ':00' : data.plannedStartDatetime) : null,
        plannedEndDatetime: data.plannedEndDatetime ? (data.plannedEndDatetime.length === 16 ? data.plannedEndDatetime + ':00' : data.plannedEndDatetime) : null,
        completedAt: data.status === 'COMPLETED' ? (data.completedAt ? (data.completedAt.length === 16 ? data.completedAt + ':00' : data.completedAt) : new Date().toISOString()) : null,
        durationMinutes: data.durationMinutes ? parseInt(data.durationMinutes, 10) : null,
        effectivenessPercent: data.effectivenessPercent ? parseInt(data.effectivenessPercent, 10) : null,
        effectivenessStarRating: data.effectivenessStarRating ? parseInt(data.effectivenessStarRating, 10) : null,
        priority: data.priority || null,
      };
      await interventionApi.update(id, payload);
      toast.success('✅ Intervention updated! Case status, progress, schedule, and field work synced automatically.', { autoClose: 4000 });
      navigate('/social-worker/interventions');
    } catch (err) {
      toast.error(err?.message || err?.response?.data?.message || 'Failed to update intervention');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center items-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-8">
      <div className="mb-6">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-primary transition-colors mb-4"
        >
          <HiArrowLeft className="w-4 h-4" />
          Back to Interventions
        </button>

        <PageHeader
          badge="Edit Intervention"
          badgeIcon={HiOutlinePencil}
          title="Update Intervention"
          subtitle="Changes auto-sync to case status, progress, schedule, and field work"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-200">Basic Information</h2>
            <Input
              label="Intervention Title"
              register={register('title')}
              error={errors.title?.message}
              placeholder="e.g., Home visit to assess child welfare"
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Select
                label="Type"
                register={register('type')}
                error={errors.type?.message}
                options={Object.values(INTERVENTION_TYPES).map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
              />
              <Select
                label="Status"
                register={register('status')}
                error={errors.status?.message}
                options={Object.values(INTERVENTION_STATUSES).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))}
              />
              <Select
                label="Priority"
                register={register('priority')}
                error={errors.priority?.message}
                options={[
                  { value: '', label: 'None' },
                  ...Object.values(CASE_PRIORITIES).map((p) => ({ value: p, label: p })),
                ]}
              />
            </div>
            <Textarea
              label="Description"
              register={register('description')}
              error={errors.description?.message}
              rows={4}
              placeholder="Describe the intervention objectives and activities..."
            />
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-200">Scheduling & Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Planned Start Date & Time"
                type="datetime-local"
                register={register('plannedStartDatetime')}
                error={errors.plannedStartDatetime?.message}
              />
              <Input
                label="Planned End Date & Time"
                type="datetime-local"
                register={register('plannedEndDatetime')}
                error={errors.plannedEndDatetime?.message}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Duration (minutes)"
                type="number"
                register={register('durationMinutes')}
                error={errors.durationMinutes?.message}
                placeholder="e.g., 60"
              />
              <Input
                label="Location"
                register={register('location')}
                error={errors.location?.message}
                placeholder="e.g., Beneficiary home, Kicukiro"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-200">Outcomes & Resources</h2>
            <Textarea
              label="Planned Outcomes"
              register={register('outcomesPlanned')}
              rows={3}
              placeholder="What do you plan to achieve?"
            />
            {(status === 'COMPLETED' || status === 'IN_PROGRESS') && (
              <Textarea
                label="Actual Outcomes"
                register={register('outcomesActual')}
                rows={3}
                placeholder="What was actually achieved?"
              />
            )}
            <Textarea
              label="Resources Needed/Used"
              register={register('resources')}
              rows={2}
              placeholder="e.g., Transport, food package, medical supplies"
            />
          </div>

          {(status === 'COMPLETED' || status === 'IN_PROGRESS') && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900 pb-2 border-b border-gray-200">Completion & Effectiveness</h2>
              {status === 'COMPLETED' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Completion Date & Time *"
                    type="datetime-local"
                    register={register('completedAt')}
                    error={errors.completedAt?.message}
                  />
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Input
                    label="Effectiveness Percentage (0–100%)"
                    type="number"
                    register={register('effectivenessPercent')}
                    error={errors.effectivenessPercent?.message}
                    placeholder="e.g., 85"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">Affects case progress calculation</p>
                </div>
                <Select
                  label="Star Rating (1–5)"
                  register={register('effectivenessStarRating')}
                  options={[
                    { value: '', label: 'Not rated' },
                    { value: '1', label: '⭐ Poor' },
                    { value: '2', label: '⭐⭐ Fair' },
                    { value: '3', label: '⭐⭐⭐ Good' },
                    { value: '4', label: '⭐⭐⭐⭐ Very Good' },
                    { value: '5', label: '⭐⭐⭐⭐⭐ Excellent' },
                  ]}
                />
              </div>
              <Textarea
                label="Completion Notes"
                register={register('completionNotes')}
                rows={4}
                placeholder="Document challenges, successes, and any follow-up needed..."
              />
            </div>
          )}

          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" loading={loading} icon={HiOutlineSave} className="flex-1 sm:flex-none">
              Save Changes
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 sm:flex-none">
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
