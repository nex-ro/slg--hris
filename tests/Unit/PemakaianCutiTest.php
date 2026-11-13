<?php

namespace Tests\Unit;

use App\Models\PemakaianCuti;
use PHPUnit\Framework\TestCase;

class PemakaianCutiTest extends TestCase
{
    public function test_leave_with_no_approver_is_not_marked_approved(): void
    {
        $pemakaianCuti = new PemakaianCuti();

        $status = $pemakaianCuti->updateStatusFinal();

        $this->assertSame('diproses', $status);
        $this->assertSame('diproses', $pemakaianCuti->status_final);
    }
}
