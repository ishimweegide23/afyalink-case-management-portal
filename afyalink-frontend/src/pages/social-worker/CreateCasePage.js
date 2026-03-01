import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { caseApi } from '../../api/caseApi';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import { CASE_PRIORITIES, USER_ROLES } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import { HiArrowLeft, HiOutlineFolder, HiOutlineUser, HiOutlineCalendar } from 'react-icons/hi';

const schema = yup.object({
  title: yup.string().trim().min(2, 'Title must be at least 2 characters').required('Case title is required'),
  beneficiaryName: yup.string().trim().min(2, 'Beneficiary name must be at least 2 characters').required('Beneficiary name is required'),
  beneficiaryIdentifier: yup.string().trim().nullable(),
  priority: yup.string().oneOf(Object.values(CASE_PRIORITIES)).required('Priority is required'),
  nextFollowUpDate: yup.string().nullable().test('not-past', 'Follow-up date cannot be in the past', (val) => {
    if (!val) return true;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(val) >= today;
  }),
});

export default function CreateCasePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === USER_ROLES.ADMIN;
  const casesListPath = isAdmin ? '/admin/cases' : '/social-worker/cases';
  const [loading, setLoading] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [loadingBeneficiaries, setLoadingBeneficiaries] = useState(true);
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { priority: 'MEDIUM' },
  });

  useEffect(() => {
    async function loadBeneficiaries() {
      setLoadingBeneficiaries(true);
      try {
        const res = await beneficiaryApi.getAll({ page: 0, size: 500 });
        const list = res?.data?.content || res?.content || [];
        setBeneficiaries(Array.isArray(list) ? list : []);
      } catch (err) {
        toast.error('Failed to load beneficiaries');
      } finally {
        setLoadingBeneficiaries(false);
      }
    }
    loadBeneficiaries();
  }, []);

  const handleBeneficiaryChange = (e) => {
    const id = e.target.value;
    if (!id) {
      setValue('beneficiaryName', '');
      setValue('beneficiaryIdentifier', '');
      return;
    }
    const b = beneficiaries.find((x) => String(x.id) === String(id));
    if (b) {
      setValue('beneficiaryName', (b.fullName || '').trim(), { shouldValidate: true });
      setValue('beneficiaryIdentifier', b.identifier || null, { shouldValidate: true });
    }
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        title: (data.title || '').trim(),
        beneficiaryName: (data.beneficiaryName || '').trim(),
        beneficiaryIdentifier: (data.beneficiaryIdentifier || '').trim() || null,
        priority: data.priority,
        nextFollowUpDate: data.nextFollowUpDate || null,
      };
      await caseApi.create(payload);
      toast.success('Case created successfully');
      navigate(casesListPath);
    } catch (err) {
      toast.error(err?.message || err.response?.data?.message || 'Failed to create case');
    } finally {
      setLoading(false);
    }
  };

  const subtitle = isAdmin
    ? 'Fill in the details below. The case will start unassigned; you can assign it from the cases list.'
    : 'Fill in the details below. The case will be automatically assigned to you.';

  return (
    <div className="space-y-6 pb-8">
      <button onClick={() => navigate(casesListPath)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary font-medium transition-colors">
        <HiArrowLeft className="w-4 h-4" /> Back to Cases
      </button>
      <PageHeader badge="New Case" badgeIcon={HiOutlineFolder} title="Create New Case" subtitle={subtitle} />
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input label="Case Title *" register={register('title')} error={errors.title?.message} placeholder="e.g. Child Protection Assessment" />

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><HiOutlineUser className="w-4 h-4 text-gray-400" /> Select Beneficiary</span>
                </label>
                <select
                  onChange={handleBeneficiaryChange}
                  disabled={loadingBeneficiaries}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white disabled:opacity-60"
                >
                  <option value="">
                    {loadingBeneficiaries ? 'Loading...' : beneficiaries.length === 0 ? (isAdmin ? 'No beneficiaries in system' : 'No beneficiaries assigned to you') : 'Choose from existing beneficiaries...'}
                  </option>
                  {beneficiaries.map((b) => (
                    <option key={b.id} value={b.id}>{b.fullName || `Beneficiary ${b.id}`}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Or type the name manually below</p>
              </div>
              <Input label="Beneficiary Name *" register={register('beneficiaryName')} error={errors.beneficiaryName?.message} placeholder="Full name of the beneficiary" />
              <Input label="Beneficiary Identifier" register={register('beneficiaryIdentifier')} placeholder="National ID, passport, or reference number" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Priority *" register={register('priority')} error={errors.priority?.message}
                options={Object.values(CASE_PRIORITIES).map((p) => ({ value: p, label: p }))} />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  <span className="flex items-center gap-1.5"><HiOutlineCalendar className="w-4 h-4 text-gray-400" /> Next Follow-up Date</span>
                </label>
                <input type="date" {...register('nextFollowUpDate')} className={`w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors.nextFollowUpDate ? 'border-red-300' : 'border-gray-200'}`} />
                {errors.nextFollowUpDate && <p className="text-xs text-red-500 mt-1">{errors.nextFollowUpDate.message}</p>}
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-800"><strong>Note:</strong> {isAdmin ? 'This case will start unassigned with' : 'This case will be automatically assigned to you and start with'} <strong>OPEN</strong> status. You can update the status and assignment later.</p>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" loading={loading}>Create Case</Button>
              <Button variant="ghost" onClick={() => navigate(casesListPath)}>Cancel</Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
