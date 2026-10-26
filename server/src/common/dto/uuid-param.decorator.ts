import { Param, ParseUUIDPipe } from '@nestjs/common';

export const UuidParam = (name = 'id') => Param(name, new ParseUUIDPipe());
