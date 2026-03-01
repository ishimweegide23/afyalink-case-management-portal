import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { caseEntryApi } from '../../api/caseEntryApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Textarea from '../../components/common/Textarea';
import Select from '../../components/common/Select';
import { CASE_ENTRY_TYPES, CASE_ENTRY_STATUSES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import { HiArrowLeft, HiOutlineDocumentText } from 'react-icons/hi';

const schema = yup.object({
  title: yup.string().required('Title is required'),
  content: yup.string().required('Content is required'),
  type: yup.string().oneOf(Object.values(CASE_ENTRY_TYPES)).required('Type is required'),
  status: yup.string().oneOf(Object.values(CASE_ENTRY_STATUSES)).required('Status is required'),
  dueDate: yup.string().nullable(),
});

export default function CreateCaseEntryPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { type: 'NOTE', status: 'PENDING' },
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = { ...data, dueDate: data.dueDate || null };
      await caseEntryApi.create(id, payload);
      toast.success('Entry created');
      navigate(`/social-worker/cases/${id}/entries`);
    }
    catch (err) { toast.error(err.response?.data?.message || 'Failed to create entry'); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Entries
      </button>
      <PageHeader
        badge="New Entry"
        badgeIcon={HiOutlineDocumentText}
        title="New Case Entry"
        subtitle="Create a NOTE for progress logs, or a TASK to track to-dos. Tasks appear in your Schedule."
      />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Title" register={register('title')} error={errors.title?.message} placeholder="Entry title" />
            <div className="grid grid-cols-2 gap-4">
              <Select label="Type" register={register('type')} error={errors.type?.message}
                options={Object.values(CASE_ENTRY_TYPES).map((t) => ({ value: t, label: t }))} />
              <Select label="Status" register={register('status')} error={errors.status?.message}
                options={Object.values(CASE_ENTRY_STATUSES).map((s) => ({ value: s, label: s.replace(/_/g, ' ') }))} />
            </div>
            <Input label="Due Date (for tasks)" type="date" register={register('dueDate')} />
            <Textarea label="Content" register={register('content')} error={errors.content?.message} rows={5} />
            <div className="flex gap-3 pt-4">
              <Button type="submit" loading={loading}>Create Entry</Button>
              <Button variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
