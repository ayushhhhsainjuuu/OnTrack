"use client";

import AddEmployeeForm from "@/components/auth/addEmployeeForm";

export default function AddEmployeePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-slate-500">
          Workforce
        </p>

        <h1 className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
          Add Employee
        </h1>

        <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
          Create a new employee account and assign their role.
        </p>
      </div>

      <AddEmployeeForm />
    </div>
  );
}
