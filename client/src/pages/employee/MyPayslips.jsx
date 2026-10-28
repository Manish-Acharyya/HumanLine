import { useCallback, useEffect, useState } from 'react';
import { Wallet, Download } from 'lucide-react';
import PageContainer from '../../components/PageContainer.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge, { statusVariant } from '../../components/ui/Badge.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import { Table, Thead, Tbody, Tr, Th, Td } from '../../components/ui/Table.jsx';
import * as payrollService from '../../services/payroll.js';
import { getErrorMessage, isNoProfileError } from '../../services/api.js';
import { formatMoney } from '../../utils/formatters.js';
import { generatePayslipPdf } from '../../utils/payslip.js';

export default function MyPayslips() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState(null);
  const [records, setRecords] = useState([]);
  const [downloading, setDownloading] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotice(null);
    try {
      const response = await payrollService.mine();
      setRecords(response.data || []);
    } catch (err) {
      if (isNoProfileError(err)) {
        setRecords([]);
        setNotice(getErrorMessage(err));
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

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
      title="My Payslips"
      description="Download your salary slips as PDF"
      loading={loading}
      error={error}
      onRetry={load}
    >
      {notice && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          {notice}
        </div>
      )}

      {records.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="No payslips yet"
          description={
            notice ||
            "Payslips appear here once payroll has been generated for your active months."
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>Payslip No.</Th>
              <Th>Period</Th>
              <Th>Gross</Th>
              <Th>Deductions</Th>
              <Th>Net pay</Th>
              <Th>Status</Th>
              <Th className="text-right">Download</Th>
            </Tr>
          </Thead>
          <Tbody>
            {records.map((record) => (
              <Tr key={record._id}>
                <Td className="font-mono text-xs">{record.payslipNo}</Td>
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
    </PageContainer>
  );
}
