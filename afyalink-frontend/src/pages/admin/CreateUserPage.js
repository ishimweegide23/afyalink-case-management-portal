import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { userApi } from '../../api/userApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import {
  USER_ROLES,
  RWANDA_DISTRICTS,
  PROVINCES,
  getDistrictsByProvince,
  getAllDistrictsForDropdown,
  getProvinceForDistrict,
} from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import {
  HiArrowLeft,
  HiOutlineUserAdd,
  HiOutlineLocationMarker,
  HiOutlineUserGroup,
} from 'react-icons/hi';

const needsLocation = (role) =>
  role === USER_ROLES.SOCIAL_WORKER || role === USER_ROLES.SUPERVISOR;

const createSchema = yup.object({
  fullName: yup.string().min(2, 'Minimum 2 characters').required('Full name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  phoneNumber: yup.string().nullable(),
  role: yup.string().oneOf(Object.values(USER_ROLES), 'Select a role').required('Role is required'),
  province: yup.string().nullable(),
  district: yup.string().when('role', {
    is: (role) => needsLocation(role),
    then: (schema) => schema.required('District is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  sector: yup.string().when('role', {
    is: (role) => needsLocation(role),
    then: (schema) => schema.required('Sector is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  cell: yup.string().when('role', {
    is: (role) => needsLocation(role),
    then: (schema) => schema.required('Cell is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  village: yup.string().nullable(),
  assignedDistrict: yup.string().when('role', {
    is: USER_ROLES.SUPERVISOR,
    then: (schema) => schema.required('Assigned district is required for Supervisor'),
    otherwise: (schema) => schema.nullable(),
  }),
  assignedProvince: yup.string().nullable(),
  supervisorId: yup.string().when('role', {
    is: USER_ROLES.SOCIAL_WORKER,
    then: (schema) => schema.required('Please select a supervisor'),
    otherwise: (schema) => schema.nullable(),
  }),
});

export default function CreateUserPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [supervisors, setSupervisors] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [districtsForProvince, setDistrictsForProvince] = useState([]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm({
    resolver: yupResolver(createSchema),
    defaultValues: {
      role: USER_ROLES.SOCIAL_WORKER,
      province: '',
      district: '',
      sector: '',
      cell: '',
      village: '',
      assignedDistrict: '',
      assignedProvince: '',
      supervisorId: '',
      phoneNumber: '',
      fullName: '',
      email: '',
      password: '',
    },
  });

  const selectedRole = watch('role');
  const selectedProvince = watch('province');
  const selectedDistrict = watch('district');
  const assignedDistrict = watch('assignedDistrict');

  useEffect(() => {
    if (selectedProvince) {
      setDistrictsForProvince(getDistrictsByProvince(selectedProvince));
    } else {
      setDistrictsForProvince(RWANDA_DISTRICTS);
    }
  }, [selectedProvince]);

  useEffect(() => {
    if (selectedRole === USER_ROLES.SOCIAL_WORKER && selectedDistrict) {
      setLoadingSupervisors(true);
      userApi
        .getSupervisorsByDistrict(selectedDistrict)
        .then((res) => setSupervisors(res?.data || []))
        .catch(() => setSupervisors([]))
        .finally(() => setLoadingSupervisors(false));
    } else {
      setSupervisors([]);
      setValue('supervisorId', '');
    }
  }, [selectedRole, selectedDistrict, setValue]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        phoneNumber: data.phoneNumber || null,
        role: data.role,
        province: data.province || getProvinceForDistrict(data.district) || null,
        district: data.district || null,
        sector: data.sector || null,
        cell: data.cell || null,
        village: data.village || null,
        assignedDistrict: data.assignedDistrict || null,
        assignedProvince: data.assignedProvince || null,
        supervisorId: data.supervisorId ? Number(data.supervisorId) : null,
      };
      await userApi.create(payload);
      toast.success('User created successfully');
      navigate('/admin/users');
    } catch (err) {
      toast.error(err?.message || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  const provinceOptions = PROVINCES.map((p) => ({ value: p.value, label: p.label }));
  const districtOptions = (selectedProvince ? districtsForProvince : RWANDA_DISTRICTS).map((d) => ({
    value: d.value,
    label: d.label,
  }));
  const allDistrictOptions = getAllDistrictsForDropdown();

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <PageHeader
        badge="Create New User"
        badgeIcon={HiOutlineUserAdd}
        title="Create User"
        subtitle="Add a new user with location and supervisor assignment"
        action={
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-sm font-medium transition-colors"
          >
            <HiArrowLeft className="w-4 h-4" /> Back
          </button>
        }
      />

      <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 sm:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
              <HiOutlineUserAdd className="w-5 h-5 text-primary" /> Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <Input
                label="Full Name *"
                register={register('fullName')}
                error={errors.fullName?.message}
                placeholder="Enter full name"
              />
              <Input
                label="Email Address *"
                type="email"
                register={register('email')}
                error={errors.email?.message}
                placeholder="user@afyalink.rw"
              />
              <Input
                label="Password *"
                type="password"
                register={register('password')}
                error={errors.password?.message}
                placeholder="Minimum 6 characters"
              />
              <Input
                label="Phone Number"
                register={register('phoneNumber')}
                error={errors.phoneNumber?.message}
                placeholder="+250 78X XXX XXX"
              />
              <Select
                label="Role *"
                register={register('role')}
                error={errors.role?.message}
                options={[
                  { value: USER_ROLES.SOCIAL_WORKER, label: 'Social Worker' },
                  { value: USER_ROLES.SUPERVISOR, label: 'Supervisor' },
                  { value: USER_ROLES.ADMIN, label: 'Administrator' },
                ]}
              />
            </div>
          </div>

          {needsLocation(selectedRole) && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 border-b border-gray-100 pb-2">
                <HiOutlineLocationMarker className="w-5 h-5 text-primary" /> Location Address
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Province"
                  options={provinceOptions}
                  register={register('province')}
                  error={errors.province?.message}
                  placeholder="Select province (optional)"
                />
                <Select
                  label="District *"
                  options={districtOptions}
                  register={register('district')}
                  error={errors.district?.message}
                  placeholder="Select district"
                />
                <Input
                  label="Sector *"
                  register={register('sector')}
                  error={errors.sector?.message}
                  placeholder="e.g., Kimihurura"
                />
                <Input
                  label="Cell *"
                  register={register('cell')}
                  error={errors.cell?.message}
                  placeholder="e.g., Rugando"
                />
                <Input
                  label="Village"
                  register={register('village')}
                  error={errors.village?.message}
                  placeholder="e.g., Umuganda"
                />
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Location is used for district-based reporting, analytics, and supervisor assignment.
              </p>
            </div>
          )}

          {selectedRole === USER_ROLES.SOCIAL_WORKER && (
            <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineUserGroup className="w-5 h-5 text-amber-600" /> Supervisor Assignment
              </h3>
              <Select
                label="Assign to Supervisor *"
                register={register('supervisorId')}
                error={errors.supervisorId?.message}
                options={supervisors.map((s) => ({
                  value: String(s.id),
                  label: `${s.fullName} (${s.assignedDistrict || s.district || 'No district'}) - ${s.email}`,
                }))}
                disabled={!selectedDistrict || loadingSupervisors}
                placeholder={
                  !selectedDistrict
                    ? 'First select a district'
                    : loadingSupervisors
                      ? 'Loading supervisors...'
                      : 'Select supervisor'
                }
              />
              {!selectedDistrict && (
                <p className="text-sm text-amber-700 mt-2 flex items-center gap-2">
                  <HiOutlineLocationMarker className="w-4 h-4 shrink-0" />
                  Select a district first to see available supervisors.
                </p>
              )}
              {selectedDistrict && supervisors.length === 0 && !loadingSupervisors && (
                <p className="text-sm text-red-700 mt-2">
                  No supervisors found for {selectedDistrict}. Create a supervisor for this district first.
                </p>
              )}
            </div>
          )}

          {selectedRole === USER_ROLES.SUPERVISOR && (
            <div className="bg-blue-50 rounded-xl p-5 border border-blue-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineUserGroup className="w-5 h-5 text-blue-600" /> Supervisor Configuration
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <Select
                  label="Assigned District *"
                  register={register('assignedDistrict')}
                  error={errors.assignedDistrict?.message}
                  options={allDistrictOptions}
                  placeholder="District to manage"
                />
                <Select
                  label="Assigned Province (optional)"
                  register={register('assignedProvince')}
                  error={errors.assignedProvince?.message}
                  options={provinceOptions}
                  placeholder="Select province"
                />
              </div>
              <p className="text-sm text-blue-800 mt-3">
                This supervisor will manage social workers in{' '}
                <span className="font-semibold">{assignedDistrict || '[selected district]'}</span> district.
              </p>
            </div>
          )}

          {selectedRole === USER_ROLES.ADMIN && (
            <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
              Admin users have full system access. Location fields are optional for administrators.
            </div>
          )}

          <div className="flex gap-3 pt-6 border-t border-gray-100">
            <Button type="submit" loading={loading}>
              {loading ? 'Creating User...' : 'Create User'}
            </Button>
            <Button variant="ghost" type="button" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
