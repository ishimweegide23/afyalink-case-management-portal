import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { toast } from 'react-toastify';
import { userApi } from '../../api/userApi';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import Spinner from '../../components/common/Spinner';
import {
  USER_ROLES,
  RWANDA_DISTRICTS,
  PROVINCES,
  getDistrictsByProvince,
  getAllDistrictsForDropdown,
  getProvinceForDistrict,
} from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import { HiArrowLeft, HiOutlinePencil, HiOutlineLocationMarker, HiOutlineUserGroup } from 'react-icons/hi';

const needsLocation = (role) =>
  role === USER_ROLES.SOCIAL_WORKER || role === USER_ROLES.SUPERVISOR;

const editSchema = yup.object({
  fullName: yup.string().required('Full name is required'),
  phoneNumber: yup.string().nullable(),
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
    then: (schema) => schema.required('Assigned district is required'),
    otherwise: (schema) => schema.nullable(),
  }),
  assignedProvince: yup.string().nullable(),
  supervisorId: yup.string().nullable(),
  role: yup.string().required(),
});

export default function EditUserPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [supervisors, setSupervisors] = useState([]);
  const [loadingSupervisors, setLoadingSupervisors] = useState(false);
  const [userRole, setUserRole] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm({ resolver: yupResolver(editSchema) });

  const selectedProvince = watch('province');
  const selectedDistrict = watch('district');
  const assignedDistrict = watch('assignedDistrict');

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await userApi.getById(id);
        const user = res?.data || {};
        setUserRole(user.role || '');
        reset({
          fullName: user.fullName || '',
          phoneNumber: user.phoneNumber || '',
          role: user.role || '',
          province: user.province || getProvinceForDistrict(user.district) || '',
          district: user.district || '',
          sector: user.sector || '',
          cell: user.cell || '',
          village: user.village || '',
          assignedDistrict: user.assignedDistrict || '',
          assignedProvince: user.assignedProvince || '',
          supervisorId: user.supervisorId ? String(user.supervisorId) : '',
        });
      } catch {
        toast.error('Failed to load user');
      } finally {
        setFetching(false);
      }
    }
    fetchUser();
  }, [id, reset]);

  useEffect(() => {
    if (userRole === USER_ROLES.SOCIAL_WORKER && selectedDistrict) {
      setLoadingSupervisors(true);
      userApi
        .getSupervisorsByDistrict(selectedDistrict)
        .then((res) => setSupervisors(res?.data || []))
        .catch(() => setSupervisors([]))
        .finally(() => setLoadingSupervisors(false));
    } else {
      setSupervisors([]);
    }
  }, [userRole, selectedDistrict]);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const payload = {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber || null,
        province: data.province || getProvinceForDistrict(data.district) || null,
        district: data.district || null,
        sector: data.sector || null,
        cell: data.cell || null,
        village: data.village || null,
        assignedDistrict: data.assignedDistrict || null,
        assignedProvince: data.assignedProvince || null,
        supervisorId: data.supervisorId ? Number(data.supervisorId) : null,
      };
      await userApi.update(id, payload);
      toast.success('User updated');
      navigate('/admin/users');
    } catch (err) {
      toast.error(err?.message || 'Failed to update');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex justify-center py-20">
        <Spinner size="lg" />
      </div>
    );
  }

  const provinceOptions = PROVINCES.map((p) => ({ value: p.value, label: p.label }));
  const districtOptions = (selectedProvince ? getDistrictsByProvince(selectedProvince) : RWANDA_DISTRICTS).map(
    (d) => ({ value: d.value, label: d.label })
  );
  const allDistrictOptions = getAllDistrictsForDropdown();

  return (
    <div className="space-y-6 pb-8 max-w-4xl mx-auto">
      <PageHeader
        badge="Edit User"
        badgeIcon={HiOutlinePencil}
        title="Edit User"
        subtitle="Update profile, location, and supervisor assignment"
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Input label="Full Name *" register={register('fullName')} error={errors.fullName?.message} />
            <Input label="Phone Number" register={register('phoneNumber')} error={errors.phoneNumber?.message} />
            <div className="md:col-span-2">
              <p className="text-sm text-gray-500">
                Role: <span className="font-medium text-gray-800">{userRole}</span> (cannot be changed here)
              </p>
            </div>
          </div>

          {needsLocation(userRole) && (
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
                  placeholder="Select province"
                />
                <Select
                  label="District *"
                  options={districtOptions}
                  register={register('district')}
                  error={errors.district?.message}
                  placeholder="Select district"
                />
                <Input label="Sector *" register={register('sector')} error={errors.sector?.message} />
                <Input label="Cell *" register={register('cell')} error={errors.cell?.message} />
                <Input label="Village" register={register('village')} error={errors.village?.message} />
              </div>
            </div>
          )}

          {userRole === USER_ROLES.SOCIAL_WORKER && (
            <div className="bg-yellow-50 rounded-xl p-5 border border-yellow-100">
              <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <HiOutlineUserGroup className="w-5 h-5 text-amber-600" /> Supervisor Assignment
              </h3>
              <Select
                label="Supervisor"
                register={register('supervisorId')}
                error={errors.supervisorId?.message}
                options={supervisors.map((s) => ({
                  value: String(s.id),
                  label: `${s.fullName} (${s.assignedDistrict || s.district || 'No district'})`,
                }))}
                disabled={!selectedDistrict || loadingSupervisors}
                placeholder={loadingSupervisors ? 'Loading...' : 'Select supervisor'}
              />
            </div>
          )}

          {userRole === USER_ROLES.SUPERVISOR && (
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
                />
                <Select
                  label="Assigned Province"
                  register={register('assignedProvince')}
                  error={errors.assignedProvince?.message}
                  options={provinceOptions}
                />
              </div>
              <p className="text-sm text-blue-800 mt-3">
                Manages workers in <span className="font-semibold">{assignedDistrict || '—'}</span> district.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <Button type="submit" loading={loading}>
              Save Changes
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
