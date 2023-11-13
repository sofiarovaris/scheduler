import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { Cron, SchedulerRegistry } from '@nestjs/schedule';
import { CronJob, CronTime } from 'cron';

@Controller('tasks')
export class TasksController {
  constructor(
    private readonly tasksService: TasksService,
    private schedulerRegistry: SchedulerRegistry,
  ) {}

  private readonly logger = new Logger(TasksService.name);

  /*Quando utiliza o cron como decorator
    a função será executada de acordo com o tempo definido
    assim que a aplicação for iniciada */
  @Cron('45 * * * * *', {
    name: 'teste_45_segundos',
  })
  handleCron() {
    this.logger.debug('esse texto é exibido no segundo 45 de cada minuto');
  }

  /*Para registrar um cron job dinamicamente, é necessário utilizar o SchedulerRegistry*/
  @Post('/:name')
  addCronJob(@Param('name') name: string) {
    // Cria um novo cron job
    const job = new CronJob(`5 * * * * *`, () => {
      this.logger.warn(`job ${name} executado!`);
    });

    // Registra o job no schedulerRegistry, assim, apartir do nome, é possível acessar o job de qualquer lugar da aplicação
    this.schedulerRegistry.addCronJob(name, job);

    this.logger.warn(
      `job ${name} adicionado com sucesso para executar no segundo 5`,
    );
  }

  /*Para parar um cron job, basta buscar o job pelo nome e utilizar o método stop*/
  @Get('/stop/:name')
  stopCron(@Param('name') name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.stop();
    this.logger.warn(`job ${name} parado!`);
  }

  /*Para iniciar um cron job, basta buscar o job pelo nome e utilizar o método start*/
  @Get('/start/:name')
  startCron(@Param('name') name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.start();
    this.logger.warn(`job ${name} iniciado!`);
  }

  /*Para buscar todos os cron jobs registrados, basta utilizar o método getCronJobs do schedulerRegistry */
  @Get('/all')
  getCronJobs() {
    try {
      const jobs = this.schedulerRegistry.getCronJobs();

      jobs.forEach((job, name) => {
        this.logger.warn(
          `job ${name} está ${job.running ? 'rodando' : 'parado'}`,
        );
      });
    } catch (e) {
      console.log(e);
    }
  }

  /*Para deletar um cron job, basta utilizar o método deleteCronJob do schedulerRegistry*/
  @Delete('/:name')
  deleteCronJob(@Param('name') name: string) {
    /*A função doesExist verifica se o job existe, mas pode ser 
      utilizada para verificar outros tipos de task scheduling como
      intervals e timeouts, basta alterar o tipo do primeiro parâmetro*/
    if (!this.schedulerRegistry.doesExist('cron', name)) {
      this.logger.warn(`job ${name} não existe!`);
      return;
    }

    //Deleta o job
    this.schedulerRegistry.deleteCronJob(name);
    this.logger.warn(`job ${name} deletado!`);
  }

  /* Para descobrir quando um cron job foi executado pela última vez, basta utilizar o método lastDate do cron job*/
  @Get('/last_execution/:name')
  getLastExecution(@Param('name') name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    const lastExecution = job.lastDate();
    this.logger.warn(
      `job ${name} foi executado pela última vez em ${lastExecution}`,
    );
  }

  /* Para descobrir quando um cron job será executado pela próxima vez, basta utilizar o método nextDate do cron job*/
  @Get('/next_execution/:name')
  getNextExecution(@Param('name') name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    const nextExecution = job.nextDate();
    this.logger.warn(
      `job ${name} será executado pela próxima vez em ${nextExecution}`,
    );
  }

  /* Para descobrir quando um cron job será executado pelas próximas vezes, basta utilizar o método nextDates do cron job*/
  @Get('/next_executions/:name')
  getNextExecutions(@Param('name') name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    const nextExecutions = job.nextDates(5);
    this.logger.warn(
      `job ${name} será executado 5 vezes nas próximas datas: ${nextExecutions}`,
    );
  }

  /* Para alterar o tempo de execução de um cron job, basta utilizar o método setTime do cron job*/
  @Put('/change_time/:name')
  changeTime(@Param('name') name: string) {
    const job = this.schedulerRegistry.getCronJob(name);
    job.setTime(new CronTime(`30 * * * * *`));
    this.logger.warn(`job ${name} alterado para executar no segundo 30`);
  }
}
