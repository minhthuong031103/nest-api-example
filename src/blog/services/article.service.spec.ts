import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { createMockInstance } from 'jest-create-mock-instance';
import { Repository } from 'typeorm';

import { User } from '@/auth/entities/user.entity';
import type { CreateArticle } from '@/blog/dto/create-article.dto';
import { UpdateArticle } from '@/blog/dto/update-article.dto';
import { Article } from '@/blog/entities/article.entity';
import { ArticleService } from '@/blog/services/article.service';

describe('ArticleService', () => {
  let service: ArticleService;
  const mockArticleRepository = createMockInstance(Repository);
  Object.setPrototypeOf(mockArticleRepository, Repository.prototype);

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArticleService,
        {
          provide: getRepositoryToken(Article),
          useValue: mockArticleRepository,
        },
      ],
    }).compile();
    mockArticleRepository.create.mockImplementation((dto) =>
      Object.assign(new Article(), dto),
    );
    mockArticleRepository.save.mockImplementation((article) =>
      Promise.resolve(article as Article),
    );

    service = module.get<ArticleService>(ArticleService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should save the new article', async () => {
    const newArticle: CreateArticle = {
      title: 'Duis ullamco eiusmod deserunt laborum.',
      content: `Eiusmod mollit officia est proident cillum amet quis elit exercitation.
Exercitation fugiat cillum irure aute aliqua do quis mollit laboris deserunt fugiat aliquip esse aute proident.
Et proident veniam dolore sunt qui ex laborum quis ut exercitation dolor est
In magna sit qui et ut fugiat ex tempor id.
Aute cillum voluptate ad ea cupidatat nostrud labore ad cillum adipisicing amet esse est nostrud irure.
Nulla minim ea quis irure veniam laborum commodo non quis non ex eu.`,
      author: new User(),
    };

    await expect(service.create(newArticle)).resolves.toBeInstanceOf(Article);
    expect(mockArticleRepository.create).toHaveBeenCalledWith(newArticle);
    expect(mockArticleRepository.save).toHaveBeenCalledWith(
      expect.any(Article),
    );
    expect(mockArticleRepository.save).toHaveBeenCalledTimes(1);
  });

  it('should get an article by its id', async () => {
    mockArticleRepository.findOne.mockResolvedValueOnce(new Article());

    await expect(
      service.getById('a832e632-0335-4191-8469-4d849bbb72be'),
    ).resolves.toBeInstanceOf(Article);
  });

  it('should find and paginate articles', async () => {
    mockArticleRepository.find.mockResolvedValueOnce([new Article()]);
    mockArticleRepository.count.mockResolvedValueOnce(1);

    await expect(service.findBy({ limit: 10, page: 1 })).resolves.toMatchObject(
      {
        items: expect.arrayContaining([expect.any(Article)]),
        meta: {
          currentPage: 1,
          itemCount: 1,
          itemsPerPage: 10,
          totalItems: 1,
          totalPages: 1,
        },
      },
    );
  });

  it('should update one article', async () => {
    const article = new Article();
    const changes: UpdateArticle = {
      content: `Minim ipsum qui non qui quis labore qui ipsum ut duis eiusmod.
Duis ex sint eiusmod qui tempor deserunt voluptate do laboris exercitation quis officia labore.
Laboris nostrud voluptate dolor occaecat consectetur laborum consectetur sit minim tempor laboris.
Commodo ex reprehenderit labore in Lorem ea aliquip culpa occaecat ex velit ipsum laboris ex anim.
Occaecat occaecat ex incididunt sit mollit ullamco fugiat velit veniam ut.
Cillum esse esse sint officia velit dolore sint magna tempor sint.
Est deserunt excepteur ut id qui excepteur eiusmod exercitation sint nulla ipsum.
Nulla ipsum do id enim et ullamco cupidatat irure anim consectetur pariatur.`,
    };

    mockArticleRepository.merge.mockImplementation(
      (article, changes) => Object.assign(article, changes) as Article,
    );

    await expect(service.update(article, changes)).resolves.toHaveProperty(
      'content',
      changes.content,
    );
  });

  it('should soft remove one article', async () => {
    const article = new Article();

    mockArticleRepository.softRemove.mockImplementation((article) =>
      Promise.resolve(Object.assign(article, { deletedAt: new Date() })),
    );

    await expect(service.remove(article)).resolves.toBeInstanceOf(Article);
    expect(mockArticleRepository.softRemove).toHaveBeenCalledWith(article);
  });

  it('should check if article with a given id exist', async () => {
    mockArticleRepository.count.mockResolvedValueOnce(1);

    await expect(
      service.checkExist('a832e632-0335-4191-8469-4d849bbb72be'),
    ).resolves.toBe(true);
  });
});
