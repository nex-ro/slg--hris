<?php

namespace Tests\Feature;

use App\Mail\PerizinanDiajukan;
use App\Models\Perizinan;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class PerizinanNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_submitting_permission_queues_email_to_the_selected_supervisor(): void
    {
        Mail::fake();

        $employee = User::factory()->create(['role' => 'pegawai']);
        $supervisor = User::factory()->create(['role' => 'atasan']);

        $this->actingAs($employee)
            ->post(route('izin.store'), [
                'type_perizinan' => 'p3',
                'tanggal' => now()->addDay()->toDateString(),
                'jam_keluar' => '09:00',
                'jam_kembali' => '10:00',
                'uid_diketahui' => $supervisor->id,
                'keperluan' => 'Keperluan pekerjaan',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('perizinans', [
            'uid' => $employee->id,
            'uid_diketahui' => $supervisor->id,
        ]);

        Mail::assertQueued(PerizinanDiajukan::class, function (PerizinanDiajukan $mail) use ($supervisor, $employee) {
            return $mail->hasTo($supervisor->email)
                && $mail->connection === 'database'
                && $mail->namaPegawai === $employee->name;
        });
    }
}
