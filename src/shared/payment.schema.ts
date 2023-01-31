import { ApiProperty } from "@nestjs/swagger";
import { PlatformEnum } from "./platform.enum";

export class PaymentSchema {
    @ApiProperty({ description: 'The id of the payment' })
    paymentId: string;

    @ApiProperty({ description: 'The platform used to for the payment' })
    platform: PlatformEnum;

    @ApiProperty({ description: 'The name of the platform used for the payment' })
    platformName: string;

    @ApiProperty({ description: 'The payment status' })
    paid: boolean;
}
