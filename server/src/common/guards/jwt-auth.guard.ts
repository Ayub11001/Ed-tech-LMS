import { ExecutionContext, Injectable } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {

    async canActivate(context: ExecutionContext) {
        console.log('before super')
        const result = await (super.canActivate(context) as Promise<boolean>)
        console.log('after super', result)
        return result
    }
}