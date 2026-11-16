<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class HrdEmployeeManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_duplicate_employee_id_returns_a_specific_validation_error(): void
    {
        $hrd = User::factory()->create(['role' => 'hrd']);
        $existingEmployee = User::factory()->create(['role' => 'pegawai']);

        $this->actingAs($hrd)
            ->post(route('pegawai.store'), [
                'id' => $existingEmployee->id,
                'name' => 'New Employee',
                'email' => 'new.employee@example.com',
                'password' => 'Password123',
                'password_confirmation' => 'Password123',
                'role' => 'pegawai',
                'active' => true,
                'tmk' => '2020-01-01',
                'divisi' => 'Operasional',
                'jabatan' => 'Staff',
                'tower' => 'Eiffel',
            ])
            ->assertSessionHasErrors('id');

        $this->assertSame(
            'ID Pegawai sudah digunakan.',
            session('errors')->get('id')[0]
        );
        $this->assertDatabaseMissing('users', ['email' => 'new.employee@example.com']);
    }

    public function test_creating_employee_requires_password_confirmation(): void
    {
        $this->actingAs(User::factory()->create(['role' => 'hrd']))
            ->post(route('pegawai.store'), [
                'id' => 101,
                'name' => 'New Employee',
                'email' => 'new.employee@example.com',
                'password' => 'Password123',
                'password_confirmation' => 'Different123',
                'role' => 'pegawai',
                'active' => true,
                'tmk' => '2020-01-01',
                'divisi' => 'Operasional',
                'jabatan' => 'Staff',
                'tower' => 'Eiffel',
            ])
            ->assertSessionHasErrors('password');

        $this->assertDatabaseMissing('users', ['email' => 'new.employee@example.com']);
    }

    public function test_updating_employee_requires_confirmation_when_changing_password(): void
    {
        $hrd = User::factory()->create(['role' => 'hrd']);
        $employee = User::factory()->create([
            'role' => 'pegawai',
            'divisi' => 'Operasional',
            'jabatan' => 'Staff',
            'tower' => 'Eiffel',
            'tmk' => '2020-01-01',
        ]);
        $originalPassword = $employee->password;

        $this->actingAs($hrd)
            ->put(route('pegawai.update', $employee->id), [
                'name' => $employee->name,
                'email' => $employee->email,
                'password' => 'NewPassword123',
                'password_confirmation' => 'Different123',
                'role' => 'pegawai',
                'active' => true,
                'tmk' => '2020-01-01',
                'divisi' => 'Operasional',
                'jabatan' => 'Staff',
                'tower' => 'Eiffel',
            ])
            ->assertSessionHasErrors('password');

        $this->assertSame($originalPassword, $employee->fresh()->password);
    }

    public function test_updating_employee_can_clear_exit_date(): void
    {
        $hrd = User::factory()->create(['role' => 'hrd']);
        $employee = User::factory()->create([
            'role' => 'pegawai',
            'divisi' => 'Operasional',
            'jabatan' => 'Staff',
            'tower' => 'Eiffel',
            'tmk' => '2020-01-01',
            'tanggal_keluar' => '2025-01-01',
        ]);

        $this->actingAs($hrd)
            ->put(route('pegawai.update', $employee->id), [
                'name' => $employee->name,
                'email' => $employee->email,
                'role' => 'pegawai',
                'active' => true,
                'tmk' => '2020-01-01',
                'tanggal_keluar' => '',
                'divisi' => 'Operasional',
                'jabatan' => 'Staff',
                'tower' => 'Eiffel',
            ])
            ->assertRedirect();

        $this->assertDatabaseHas('users', [
            'id' => $employee->id,
            'tanggal_keluar' => null,
        ]);
    }

    public function test_employee_list_can_be_sorted_by_name_in_both_directions(): void
    {
        $hrd = User::factory()->create(['role' => 'hrd']);
        User::factory()->create(['role' => 'pegawai', 'name' => 'Alpha Employee']);
        User::factory()->create(['role' => 'pegawai', 'name' => 'Zoe Employee']);

        $this->actingAs($hrd)
            ->getJson(route('getPegawai') . '?sortBy=name&sortDirection=desc')
            ->assertOk()
            ->assertJsonPath('users.data.0.name', 'Zoe Employee')
            ->assertJsonPath('users.data.2.name', 'Alpha Employee');

        $this->getJson(route('getPegawai') . '?sortBy=name&sortDirection=asc')
            ->assertOk()
            ->assertJsonPath('users.data.0.name', 'Alpha Employee')
            ->assertJsonPath('users.data.2.name', 'Zoe Employee');
    }
}
