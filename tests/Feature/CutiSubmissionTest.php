<?php

namespace Tests\Feature;

use App\Models\JatahCuti;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CutiSubmissionTest extends TestCase
{
    use RefreshDatabase;

    public function test_regular_leave_submission_requires_at_least_one_approver(): void
    {
        $user = User::factory()->create([
            'tmk' => '2020-01-01',
        ]);
        $jatahCuti = $this->createJatahCuti($user);

        $response = $this->actingAs($user)
            ->from('/pegawai/cuti')
            ->post(route('cuti.store'), $this->submissionData($jatahCuti));

        $response->assertSessionHasErrors('error');
        $this->assertDatabaseCount('pemakaian_cuti', 0);
    }

    public function test_regular_leave_submission_cannot_assign_the_applicant_as_approver(): void
    {
        $user = User::factory()->create([
            'tmk' => '2020-01-01',
        ]);
        $jatahCuti = $this->createJatahCuti($user);

        $response = $this->actingAs($user)
            ->from('/pegawai/cuti')
            ->post(route('cuti.store'), $this->submissionData($jatahCuti, [
                'diketahui_atasan' => $user->id,
            ]));

        $response->assertSessionHasErrors('error');
        $this->assertDatabaseCount('pemakaian_cuti', 0);
    }

    private function createJatahCuti(User $user): JatahCuti
    {
        return JatahCuti::create([
            'uid' => $user->id,
            'tahun_ke' => 6,
            'tahun' => 2026,
            'jumlah_cuti' => 12,
            'sisa_cuti' => 12,
        ]);
    }

    private function submissionData(JatahCuti $jatahCuti, array $overrides = []): array
    {
        return array_merge([
            'jatah_cuti_id' => $jatahCuti->id,
            'tanggal_mulai' => '2026-11-16',
            'tanggal_selesai' => '2026-11-16',
            'cuti_setengah_hari' => false,
            'alasan' => 'Keperluan keluarga',
            'diketahui_atasan' => null,
            'diketahui_hrd' => null,
            'disetujui' => null,
        ], $overrides);
    }
}
