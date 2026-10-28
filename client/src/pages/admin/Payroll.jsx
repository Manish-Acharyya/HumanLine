import { useCallback, useEffect, useState } from 'react';
import { Wallet, Download, RefreshCw } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Button from '../../components/ui/Button.jsx';
import Select from '../../components/ui/Select.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import ErrorAlert from '../../components/ui/ErrorAlert.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import * as payrollService from '../../services/payroll.js';
import { getErrorMessage } from '../../services/api.js';
import { employeeName, formatMoney } from '../../utils/formatters.js';
import { generatePayslipPdf } from '../../utils/payslip.js';
import { MONTHS } from '../../utils/constants.js';

const current = new Date();

export default function Payroll() {
  const [period, setPeriod] = useState({
    month: current.getMonth() + 1,
    year: current.getFullYear(),
  });
  const [records, setRecords] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await payrollService.list({
        month: period.month,
        year: period.year,
        limit: 100,
      });
      setRecords(response.data || []);
      setPagination(response.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const response = await payrollService.generate(period.month, period.year);
      setNotice(response.message);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setGenerating(false);
    }
  };

  const download = async (record) => {
    setDownloading(record._id);
    setError(null);
    try {
      const response = await payrollService.detail(record._id);
      generatePayslipPdf({ payroll: response.data });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PageContainer
      title="Payroll"
      description="Generate monthly payroll and download payslips"
      loading={loading}
      error={error}
      onRetry={load}
      actions={
        <>
          <Select
            name="month"
            value={period.month}
            onChange={(event) =>
              setPeriod((prev) => ({ ...prev, month: Number(event.target.value) }))
            }
            className="w-40"
          >
            {MONTHS.map((month, index) => (
              <option key={month} value={index + 1}>
                {month}
              </option>
            ))}
          </Select>
          <Select
            name="year"
            value={period.year}
            onChange={(event) =>
              setPeriod((prev) => ({ ...prev, year: Number(event.target.value) }))
            }
            className="w-28"
          >
            {[0, 1, 2].map((offset) => (
              <option key={offset} value={current.getFullYear() - offset}>
                {current.getFullYear() - offset}
              </option>
            ))}
          </Select>
          <Button onClick={generate} loading={generating}>
            <RefreshCw className="h-4 w-4" />
            Generate payroll
          </Button>
        </>
      }
    >
      {notice && (
        <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {notice}
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payroll for this period"
          description="Click “Generate payroll” to calculate salaries for all active employees."
          action={
            <Button size="sm" onClick={generate} loading={generating}>
              <RefreshCw className="h-4 w-4" />
              Generate payroll
            </Button>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Employee</Th>
              <Th>Period</Th>
              <Th>Gross</Th>
              <Th>Deductions</Th>
              <Th>Net pay</Th>
              <Th>Status</Th>
              <Th className="text-right">Payslip</Th>
            </Tr>
          </Thead>
          <Tbody>
            {records.map((record) => (
              <Tr key={record._id}>
                <Td>
                  <p className="font-medium text-slate-900">{employeeName(record.employee)}</p>
                  <p className="text-xs text-slate-500">{record.employee?.employeeId}</p>
                </Td>
                <Td>{record.periodLabel}</Td>
                <Td>{formatMoney(record.grossPay)}</Td>
                <Td className="text-red-600">{formatMoney(record.totalDeductions)}</Td>
                <Td className="font-semibold text-slate-900">{formatMoney(record.netPay)}</Td>
                <Td>
                  <Badge variant={statusVariant(record.status)}>{record.status}</Badge>
                </Td>
                <Td>
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => download(record)}
                      loading={downloading === record._id}
                    >
                      <Download className="h-3.5 w-3.5" />
                      PDF
                    </Button>
                  </div>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      )}

      {pagination.pages > 1 && (
        <p className="mt-4 text-sm text-slate-500">
          Showing {records.length} of {pagination.total} records
        </p>
      )}
    </PageContainer>
  );
}
