import React, { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { beneficiaryApi } from '../../api/beneficiaryApi';
import { useAuth } from '../../context/AuthContext';
import { usePagination } from '../../hooks/usePagination';
import { useSearch } from '../../hooks/useSearch';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Textarea from '../../components/common/Textarea';
import Badge from '../../components/common/Badge';
import PageHeader from '../../components/layout/PageHeader';
import { formatDate } from '../../utils/formatDate';
import {
  BENEFICIARY_STATUS,
  VULNERABILITY_LEVEL,
  BENEFICIARY_CATEGORIES,
  USER_ROLES,
  RWANDA_DISTRICTS,
} from '../../utils/constants';
import { canCreateBeneficiary } from '../../utils/permissions';
import { getPriorityColor } from '../../utils/getPriorityColor';
import { getInitials } from '../../utils/helpers';
import BeneficiaryAvatar from '../../components/shared/BeneficiaryAvatar';
import UserAvatar from '../../components/shared/UserAvatar';
import {
  HiOutlinePlus, HiOutlineEye, HiOutlineSearch, HiOutlineUsers,
  HiOutlineCamera, HiOutlinePhotograph,
  HiOutlineShieldCheck, HiOutlineClock, HiOutlineExclamation,
  HiOutlineUser, HiOutlineLocationMarker, HiOutlinePhone,
  HiOutlineMail, HiOutlineDocumentText, HiOutlinePencil,
  HiOutlineCalendar, HiOutlineTag, HiOutlineCheck, HiOutlineX,
} from 'react-icons/hi';

const createSchema = yup.object({
  fullName: yup.string().min(2, 'Minimum 2 characters').required('Full name is required'),
  dateOfBirth: yup.string().required('Date of birth is required'),
  gender: yup.string().required('Gender is required'),
  category: yup.string().required('Category is required'),
  caseType: yup.string().required('Case type is required'),
  vulnerabilityLevel: yup.string().oneOf(['HIGH', 'MEDIUM', 'LOW']).required('Required'),
  district: yup.string().required('District is required'),
  sector: yup.string().required('Sector is required'),
  cell: yup.string().nullable(),
  village: yup.string().nullable(),
  phoneNumber: yup.string().nullable(),
  email: yup.string().email('Invalid email').nullable(),
  guardianName: yup.string().nullable(),
  guardianPhone: yup.string().nullable(),
  guardianRelation: yup.string().nullable(),
});

const CASE_TYPES = [
  'Health', 'Protection', 'Education', 'Nutrition',
  'Vocational Training', 'Economic Empowerment', 'Education & Health',
];

const NEEDS_OPTIONS = [
  'Education', 'Healthcare', 'Nutrition', 'Protection',
  'Vocational Training', 'Economic Support', 'Mentorship', 'Job Placement',
];

const DISTRICTS = RWANDA_DISTRICTS.map((d) => d.value);

const GUARDIAN_RELATIONS = ['Mother', 'Father', 'Grandmother', 'Grandfather', 'Aunt', 'Uncle', 'Sibling', 'Self', 'Other'];

function getStatusColor(status) {
  const map = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    CLOSED: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  return map[status] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function getVulnColor(level) {
  const map = {
    HIGH: 'bg-red-100 text-red-700 border-red-200',
    MEDIUM: 'bg-orange-100 text-orange-700 border-orange-200',
    LOW: 'bg-blue-100 text-blue-700 border-blue-200',
  };
  return map[level] || 'bg-gray-100 text-gray-600 border-gray-200';
}

function getVulnLabel(level) {
  const map = { HIGH: 'High Risk', MEDIUM: 'Medium Risk', LOW: 'Low Risk' };
  return map[level] || level;
}

function StatCard({ icon: Icon, label, value, iconColor }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColor} bg-opacity-10`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

export default function BeneficiariesPage() {
  const { user } = useAuth();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [vulnerabilityFilter, setVulnerabilityFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({});
  const [saving, setSaving] = useState(false);
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [profilePicFile, setProfilePicFile] = useState(null);
  const [profilePicPreview, setProfilePicPreview] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const profilePicInputRef = React.useRef(null);
  const { keyword, debouncedKeyword, handleSearch } = useSearch();
  const pagination = usePagination();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(createSchema),
    defaultValues: { vulnerabilityLevel: 'MEDIUM' },
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page: pagination.page, size: pagination.size };
      if (debouncedKeyword) params.keyword = debouncedKeyword;
      if (statusFilter) params.status = statusFilter;
      if (categoryFilter) params.category = categoryFilter;
      if (vulnerabilityFilter) params.vulnerability = vulnerabilityFilter;

      const hasFilters = debouncedKeyword || statusFilter || categoryFilter || vulnerabilityFilter;
      const res = hasFilters
        ? await beneficiaryApi.search(params)
        : await beneficiaryApi.getAll(params);
      const d = res?.data;
      setData(d?.content || []);
      pagination.updateFromResponse(d);
    } catch {
      toast.error('Failed to load beneficiaries');
    } finally {
      setLoading(false);
    }
  }, [debouncedKeyword, statusFilter, categoryFilter, vulnerabilityFilter, pagination.page, pagination.size]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onCreateSubmit = async (formData) => {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        needs: selectedNeeds.length > 0 ? selectedNeeds : null,
      };
      const res = await beneficiaryApi.create(payload);
      const created = res?.data ?? res;
      if (profilePicFile && created?.id) {
        try {
          await beneficiaryApi.uploadProfilePicture(created.id, profilePicFile);
        } catch (e) {
          toast.warning('Beneficiary created but profile picture upload failed');
        }
      }
      toast.success('Beneficiary registered successfully');
      setShowCreate(false);
      setSelectedNeeds([]);
      setProfilePicFile(null);
      setProfilePicPreview(null);
      reset();
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to register beneficiary');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!showDetail) return;
    setSaving(true);
    try {
      await beneficiaryApi.update(showDetail.id, editData);
      toast.success('Beneficiary updated successfully');
      setEditMode(false);
      setEditData({});
      fetchData();
      const refreshed = await beneficiaryApi.getById(showDetail.id);
      setShowDetail(refreshed?.data || showDetail);
    } catch (err) {
      toast.error(err?.message || 'Failed to update');
    } finally {
      setSaving(false);
    }
  };

  const openDetail = async (row) => {
    try {
      const res = await beneficiaryApi.getById(row.id);
      setShowDetail(res?.data || row);
    } catch {
      setShowDetail(row);
    }
    setProfilePicFile(null);
    setProfilePicPreview(null);
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setProfilePicFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setProfilePicPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleUploadProfilePic = async (file) => {
    const fileToUpload = file || profilePicFile;
    if (!showDetail?.id || !fileToUpload) return;
    setUploadingPhoto(true);
    try {
      const res = await beneficiaryApi.uploadProfilePicture(showDetail.id, fileToUpload);
      setShowDetail(res?.data ?? showDetail);
      setProfilePicFile(null);
      setProfilePicPreview(null);
      toast.success('Profile picture updated');
      fetchData();
    } catch (err) {
      toast.error(err?.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const startEdit = () => {
    setEditMode(true);
    setEditData({
      fullName: showDetail.fullName,
      status: showDetail.status,
      vulnerabilityLevel: showDetail.vulnerabilityLevel,
      category: showDetail.category,
      caseType: showDetail.caseType,
      phoneNumber: showDetail.phoneNumber,
      email: showDetail.email,
    });
  };

  const toggleNeed = (need) => {
    setSelectedNeeds((prev) =>
      prev.includes(need) ? prev.filter((n) => n !== need) : [...prev, need]
    );
  };

  const stats = {
    total: pagination.totalElements || data.length,
    active: data.filter((b) => b.status === 'ACTIVE').length,
    pending: data.filter((b) => b.status === 'PENDING').length,
    highRisk: data.filter((b) => b.vulnerabilityLevel === 'HIGH').length,
  };

  const isSocialWorker = user?.role === USER_ROLES.SOCIAL_WORKER;
  const isSupervisor = user?.role === USER_ROLES.SUPERVISOR;

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        badge="Beneficiary Management"
        badgeIcon={HiOutlineUsers}
        title="Beneficiaries"
        subtitle={
          isSocialWorker
            ? 'Register and manage your assigned beneficiaries'
            : isSupervisor
              ? 'View beneficiaries assigned to your team’s social workers'
              : 'Monitor beneficiaries and review interventions'
        }
        action={canCreateBeneficiary(user?.role) && (
          <Button variant="header" icon={HiOutlinePlus} onClick={() => setShowCreate(true)}>
            Register Beneficiary
          </Button>
        )}
      />

      {/* Role notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <HiOutlineShieldCheck className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-800">
          {isSocialWorker
            ? 'You can view and manage beneficiaries assigned to you. To discuss cases or request support, use the messaging feature.'
            : 'You have access to all beneficiary profiles. You can review interventions and generate reports.'}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={HiOutlineUsers} label={isSocialWorker ? 'My Beneficiaries' : isSupervisor ? 'Team Beneficiaries' : 'Total Beneficiaries'} value={stats.total} iconColor="text-blue-500" />
        <StatCard icon={HiOutlineCheck} label="Active Cases" value={stats.active} iconColor="text-green-500" />
        <StatCard icon={HiOutlineClock} label="Pending" value={stats.pending} iconColor="text-yellow-500" />
        <StatCard icon={HiOutlineExclamation} label="High Risk" value={stats.highRisk} iconColor="text-red-500" />
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative col-span-1 sm:col-span-2">
            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, ID, or location..."
              value={keyword}
              onChange={(e) => { handleSearch(e.target.value); pagination.resetPage(); }}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); pagination.resetPage(); }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Status</option>
            {Object.entries(BENEFICIARY_STATUS).map(([k, v]) => (
              <option key={k} value={v}>{k.charAt(0) + k.slice(1).toLowerCase()}</option>
            ))}
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); pagination.resetPage(); }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Categories</option>
            {BENEFICIARY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={vulnerabilityFilter}
            onChange={(e) => { setVulnerabilityFilter(e.target.value); pagination.resetPage(); }}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="">All Risk Levels</option>
            <option value="HIGH">High Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="LOW">Low Risk</option>
          </select>
        </div>
      </div>

      {/* Beneficiaries Card Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
        </div>
      ) : data.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12 text-center">
          <HiOutlineUsers className="w-14 h-14 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg font-medium">No beneficiaries found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your search or filters</p>
          {canCreateBeneficiary(user?.role) && (
            <Button icon={HiOutlinePlus} onClick={() => setShowCreate(true)} className="mt-4">
              Register Beneficiary
            </Button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {data.map((ben) => (
              <div
                key={ben.id}
                onClick={() => openDetail(ben)}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer p-5 group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BeneficiaryAvatar beneficiary={ben} size="lg" className="w-11 h-11" />
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-primary transition-colors">{ben.fullName}</h3>
                      <p className="text-xs text-gray-400">{ben.identifier}</p>
                    </div>
                  </div>
                  <button className="p-1.5 rounded-lg hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity">
                    <HiOutlineEye className="w-4 h-4 text-blue-600" />
                  </button>
                </div>

                <div className="flex items-center gap-2 flex-wrap mb-3">
                  <Badge color={getStatusColor(ben.status)}>{ben.status}</Badge>
                  <Badge color={getVulnColor(ben.vulnerabilityLevel)}>{getVulnLabel(ben.vulnerabilityLevel)}</Badge>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <HiOutlineUser className="w-4 h-4 flex-shrink-0" />
                    <span>{ben.gender}{ben.dateOfBirth ? `, Born ${formatDate(ben.dateOfBirth)}` : ''}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <HiOutlineLocationMarker className="w-4 h-4 flex-shrink-0" />
                    <span>{[ben.sector, ben.district].filter(Boolean).join(', ') || 'No location'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <HiOutlineTag className="w-4 h-4 flex-shrink-0" />
                    <span>{ben.category || 'Uncategorized'}</span>
                  </div>
                  {ben.assignedSocialWorker && (
                    <div className="flex items-center gap-2 text-gray-500">
                      <UserAvatar user={ben.assignedSocialWorker} size="xs" className="flex-shrink-0" />
                      <span className="font-medium text-gray-700">{ben.assignedSocialWorker.fullName}</span>
                    </div>
                  )}
                </div>

                {ben.needs && ben.needs.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-gray-50">
                    {ben.needs.slice(0, 3).map((need, i) => (
                      <span key={i} className="px-2 py-0.5 bg-gray-50 text-gray-500 rounded text-xs">{need}</span>
                    ))}
                    {ben.needs.length > 3 && <span className="text-xs text-gray-400">+{ben.needs.length - 3} more</span>}
                  </div>
                )}

                <div className="pt-3 mt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                  <span>Registered {formatDate(ben.createdAt)}</span>
                  {ben.updatedAt && <span>Updated {formatDate(ben.updatedAt)}</span>}
                </div>
              </div>
            ))}
          </div>
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            totalElements={pagination.totalElements}
            onPageChange={pagination.goToPage}
          />
        </>
      )}

      {/* ═══════════ CREATE BENEFICIARY MODAL ═══════════ */}
      <Modal isOpen={showCreate} onClose={() => { setShowCreate(false); setSelectedNeeds([]); setProfilePicFile(null); setProfilePicPreview(null); reset(); }} title="Register New Beneficiary" size="xl">
        <form onSubmit={handleSubmit(onCreateSubmit)} className="space-y-6">
          {/* Profile Picture */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-200 flex items-center justify-center">
                {profilePicPreview ? (
                  <img src={profilePicPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <HiOutlinePhotograph className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <input
                  ref={profilePicInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleProfilePicChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => profilePicInputRef.current?.click()}>
                  <HiOutlineCamera className="w-4 h-4 mr-2" /> Choose Photo
                </Button>
                {profilePicFile && (
                  <p className="text-xs text-gray-500 mt-1 truncate max-w-[180px]">{profilePicFile.name}</p>
                )}
                <p className="text-xs text-gray-400 mt-1">JPG, PNG or WebP. Max 5MB.</p>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HiOutlineUser className="w-4 h-4 text-primary" /> Personal Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Input label="Full Name *" placeholder="e.g. John Mukiza" register={register('fullName')} error={errors.fullName?.message} />
              </div>
              <Input label="Date of Birth *" type="date" register={register('dateOfBirth')} error={errors.dateOfBirth?.message} />
              <Select label="Gender *" register={register('gender')} error={errors.gender?.message}
                options={[{ value: 'Male', label: 'Male' }, { value: 'Female', label: 'Female' }, { value: 'Other', label: 'Other' }]} />
              <Input label="Phone Number" placeholder="+250 xxx xxx xxx" register={register('phoneNumber')} />
              <Input label="Email" type="email" placeholder="email@example.com" register={register('email')} error={errors.email?.message} />
            </div>
          </div>

          {/* Case Information */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HiOutlineDocumentText className="w-4 h-4 text-primary" /> Case Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="Category *" register={register('category')} error={errors.category?.message}
                options={BENEFICIARY_CATEGORIES.map((c) => ({ value: c, label: c }))} />
              <Select label="Case Type *" register={register('caseType')} error={errors.caseType?.message}
                options={CASE_TYPES.map((t) => ({ value: t, label: t }))} />
              <Select label="Vulnerability Level *" register={register('vulnerabilityLevel')} error={errors.vulnerabilityLevel?.message}
                options={[{ value: 'HIGH', label: 'High Risk' }, { value: 'MEDIUM', label: 'Medium Risk' }, { value: 'LOW', label: 'Low Risk' }]} />
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Identified Needs</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {NEEDS_OPTIONS.map((need) => (
                  <label key={need} className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer text-sm transition-all ${
                    selectedNeeds.includes(need) ? 'bg-primary/5 border-primary text-primary' : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}>
                    <input type="checkbox" checked={selectedNeeds.includes(need)} onChange={() => toggleNeed(need)} className="sr-only" />
                    {selectedNeeds.includes(need) ? <HiOutlineCheck className="w-4 h-4" /> : <div className="w-4 h-4 rounded border border-gray-300" />}
                    {need}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HiOutlineLocationMarker className="w-4 h-4 text-primary" /> Location
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select label="District *" register={register('district')} error={errors.district?.message}
                options={DISTRICTS.map((d) => ({ value: d, label: d }))} />
              <Input label="Sector *" placeholder="Enter sector" register={register('sector')} error={errors.sector?.message} />
              <Input label="Cell" placeholder="Enter cell" register={register('cell')} />
              <Input label="Village" placeholder="Enter village" register={register('village')} />
            </div>
          </div>

          {/* Guardian */}
          <div className="pt-4 border-t border-gray-100">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <HiOutlineUsers className="w-4 h-4 text-primary" /> Guardian Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Guardian Name" placeholder="Guardian name" register={register('guardianName')} />
              <Input label="Guardian Phone" placeholder="+250 xxx xxx xxx" register={register('guardianPhone')} />
              <Select label="Relation to Beneficiary" register={register('guardianRelation')}
                options={GUARDIAN_RELATIONS.map((r) => ({ value: r, label: r }))} />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="ghost" onClick={() => { setShowCreate(false); setSelectedNeeds([]); setProfilePicFile(null); setProfilePicPreview(null); reset(); }}>Cancel</Button>
            <Button type="submit" loading={saving} icon={HiOutlinePlus}>Register Beneficiary</Button>
          </div>
        </form>
      </Modal>

      {/* ═══════════ DETAIL MODAL ═══════════ */}
      <Modal isOpen={!!showDetail} onClose={() => { setShowDetail(null); setEditMode(false); setEditData({}); }} title="Beneficiary Profile" size="xl">
        {showDetail && (
          <div className="space-y-5">
            {/* Header with avatar and badges */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <BeneficiaryAvatar beneficiary={showDetail} size="xl" className="w-14 h-14" />
                  {isSocialWorker && (
                    <>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file && file.type.startsWith('image/')) {
                            handleUploadProfilePic(file);
                          }
                          e.target.value = '';
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        title="Change photo"
                        disabled={uploadingPhoto}
                      />
                      <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        {uploadingPhoto ? (
                          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <HiOutlineCamera className="w-6 h-6 text-white" />
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{showDetail.fullName}</h2>
                  <p className="text-sm text-gray-400">{showDetail.identifier}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge color={getStatusColor(showDetail.status)}>{showDetail.status}</Badge>
                    <Badge color={getVulnColor(showDetail.vulnerabilityLevel)}>{getVulnLabel(showDetail.vulnerabilityLevel)}</Badge>
                  </div>
                </div>
              </div>
              {isSocialWorker && !editMode && (
                <Button variant="outline" size="sm" icon={HiOutlinePencil} onClick={startEdit}>Edit</Button>
              )}
              {editMode && (
                <div className="flex gap-2">
                  <Button size="sm" loading={saving} onClick={handleUpdate}>Save Changes</Button>
                  <Button variant="ghost" size="sm" icon={HiOutlineX} onClick={() => { setEditMode(false); setEditData({}); }} />
                </div>
              )}
            </div>

            {/* Personal Information */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Full Name</p>
                  {editMode ? (
                    <input className="w-full px-3 py-1.5 border rounded-lg text-sm" value={editData.fullName || ''} onChange={(e) => setEditData({ ...editData, fullName: e.target.value })} />
                  ) : (
                    <p className="font-medium text-gray-900">{showDetail.fullName}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Date of Birth</p>
                  <p className="font-medium text-gray-900">{formatDate(showDetail.dateOfBirth)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Gender</p>
                  <p className="font-medium text-gray-900">{showDetail.gender || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Category</p>
                  {editMode ? (
                    <select className="w-full px-3 py-1.5 border rounded-lg text-sm" value={editData.category || ''} onChange={(e) => setEditData({ ...editData, category: e.target.value })}>
                      {BENEFICIARY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  ) : (
                    <p className="font-medium text-gray-900">{showDetail.category || '—'}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Case Type</p>
                  <p className="font-medium text-gray-900">{showDetail.caseType || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Status</p>
                  {editMode ? (
                    <select className="w-full px-3 py-1.5 border rounded-lg text-sm" value={editData.status || ''} onChange={(e) => setEditData({ ...editData, status: e.target.value })}>
                      <option value="ACTIVE">Active</option>
                      <option value="PENDING">Pending</option>
                      <option value="CLOSED">Closed</option>
                    </select>
                  ) : (
                    <Badge color={getStatusColor(showDetail.status)}>{showDetail.status}</Badge>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Vulnerability Level</p>
                  {editMode ? (
                    <select className="w-full px-3 py-1.5 border rounded-lg text-sm" value={editData.vulnerabilityLevel || ''} onChange={(e) => setEditData({ ...editData, vulnerabilityLevel: e.target.value })}>
                      <option value="HIGH">High Risk</option>
                      <option value="MEDIUM">Medium Risk</option>
                      <option value="LOW">Low Risk</option>
                    </select>
                  ) : (
                    <Badge color={getVulnColor(showDetail.vulnerabilityLevel)}>{getVulnLabel(showDetail.vulnerabilityLevel)}</Badge>
                  )}
                </div>
                {showDetail.needs && showDetail.needs.length > 0 && (
                  <div className="col-span-2">
                    <p className="text-gray-400 text-xs mb-1.5">Identified Needs</p>
                    <div className="flex flex-wrap gap-1.5">
                      {showDetail.needs.map((need, i) => (
                        <span key={i} className="px-2.5 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-600">{need}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <HiOutlinePhone className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Phone</p>
                    <p className="font-medium text-gray-900">{showDetail.phoneNumber || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <HiOutlineMail className="w-4 h-4 text-gray-400" />
                  <div>
                    <p className="text-gray-400 text-xs">Email</p>
                    <p className="font-medium text-gray-900">{showDetail.email || '—'}</p>
                  </div>
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <HiOutlineLocationMarker className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-400 text-xs">Location</p>
                    <p className="font-medium text-gray-900">
                      {[showDetail.village, showDetail.cell, showDetail.sector, showDetail.district].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Information */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Guardian Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Guardian Name</p>
                  <p className="font-medium text-gray-900">{showDetail.guardianName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Relation</p>
                  <p className="font-medium text-gray-900">{showDetail.guardianRelation || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Guardian Phone</p>
                  <p className="font-medium text-gray-900">{showDetail.guardianPhone || '—'}</p>
                </div>
              </div>
            </div>

            {/* Assignment Info */}
            <div className="bg-gray-50 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Assignment</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Assigned Social Worker</p>
                  <p className="font-medium text-gray-900">{showDetail.assignedSocialWorker?.fullName || '—'}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Registered</p>
                  <p className="font-medium text-gray-900">{formatDate(showDetail.createdAt)}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-0.5">Last Updated</p>
                  <p className="font-medium text-gray-900">{formatDate(showDetail.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
