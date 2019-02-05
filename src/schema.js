// Welcome to Launchpad!
// Log in to edit and save pads, and run queries in GraphiQL on the right.

import {
  makeExecutableSchema,
  addMockFunctionsToSchema,
  MockList
} from 'graphql-tools'
// import { graphql, GraphQLObjectType, GraphQLSchema } from 'graphql'

import { GraphQLDateTime } from 'graphql-iso-date'
import GraphQLJSON from 'graphql-type-json'

import f from 'lodash'
// data mocking helpers:
import titleCase from 'ap-style-title-case'
import casual from 'casual-browserify'
import words from 'categorized-words'
const gql = y => y // just for syntax highlighting

const typeDefs = gql`
  scalar DateTime
  scalar JSON

  union CollectionItem = MediaEntry | Collection
  union MetaDatumSubject = MediaEntry | Collection
  #union MetaDatum = MetaDatumText | MetaDatumKeywords

  enum displayNameStyle {
    FULL
    SHORT
    INITIALS
  }

  type User {
    id: ID!
    person: Person!
    mediaEntries(limit: Int): [MediaEntry!]!
    collections(limit: Int): [Collection!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Person {
    id: ID!
    user: User
    displayName(style: displayNameStyle = FULL): String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MediaFile {
    id: ID!
    filename: String!
    sizeBytes: Int!
    mimeType: String!
    embeddedMetadata: JSON
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  """
  A *MediaEntry* represents a user-created entry consisting of a *MediaFile*
  and associated \`metaData\`.
  """
  type MediaEntry {
    id: ID
    author: User!
    responsible: User!
    title: String!
    metaData: [MetaDatum!]!
    mediaFile: MediaFile!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Collection {
    id: ID
    author: User!
    responsible: User!
    contents(limit: Int): [CollectionItem!]!
    title: String!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  interface MetaDatum {
    id: ID
    metaKey: MetaKey!
    on: MetaDatumSubject!
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MetaDatumText implements MetaDatum {
    string: String!
    id: ID
    metaKey: MetaKey!
    on: MetaDatumSubject!
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MetaDatumPeople implements MetaDatum {
    people: [Person!]!
    id: ID
    metaKey: MetaKey!
    on: MetaDatumSubject!
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MetaDatumKeywords implements MetaDatum {
    keywords: [Keyword!]!
    id: ID
    metaKey: MetaKey!
    on: MetaDatumSubject!
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Keyword {
    name: String!
    id: ID
    createdBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type MetaKey {
    id: String!
    vocabulary: Vocabulary!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Vocabulary {
    id: ID!
    name: String!
    metaKeys: [MetaKey!]!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Query {
    mediaEntries(limit: Int): [MediaEntry!]!
    collections(limit: Int): [Collection!]!
    mediaFiles(limit: Int): [MediaFile!]!
    author(id: Int): User
    topPosts(limit: Int): [MediaEntry!]!
  }
`

const resolvers = {
  JSON: GraphQLJSON,
  DateTime: GraphQLDateTime
}

export const schema = makeExecutableSchema({ typeDefs, resolvers })

const mocks = () => ({
  // Here you could customize the mocks.
  // If you leave it empty, the default is used.
  // You can read more about mocking here: http://bit.ly/2pOYqXF
  DateTime: () => casual.moment.toDate(),
  JSON: () =>
    new Array(samp([2, 3, 5, 8])).fill(1).reduce(
      m => ({
        ...m,
        [mockJsonKey()]: mockJsonValue()
      }),
      {}
    ),
  MediaEntry: () => ({
    metaData: () => new MockList([0, 12]),
    title: () =>
      titleCase(
        samp([
          `${samp(['My', 'A', 'Another', 'The', 'Das'])} ${samp(
            words.A
          )} ${samp(physicalMediaTypes)}`,
          `${samp(samp(words))}!`,
          `${samp(words.A)} and ${samp(words.A)} ${samp(physicalMediaTypes)}`,
          `On ${actionize(samp(words.V))}`,
          `${samp(['On', 'About', 'The process of', 'the art of'])} ${samp(
            words.A
          )} ${actionize(samp(words.V))}`,
          `How to ${samp(words.V)} ${pluralize(samp(words.N))}`,
          `${samp(['Questions about the'])} ${samp(words.A)} ${samp(words.V)}`
        ])
      ),
    ...timestamps
  }),
  Collection: () => ({
    metaData: () => new MockList([0, 8]),
    title: () =>
      titleCase(
        samp([
          `My ${actionize(samp(words.V))} ${pluralize(
            samp(words.N)
          )} Collection`,
          `"${samp(samp(words))}!" (AT)`,
          `${samp(words.N)} ${casual.year}!`,
          `${samp(words.N)} ${pluralize(samp(physicalMediaTypes))}!`,
          `${samp(['List of', 'All the'])} ${pluralize(samp(words.N))}`,
          `${samp(words.A)} ${pluralize(samp(physicalMediaTypes))}`,
          `${samp(words.A)} (${samp(physicalMediaTypes)})`,
          `${samp(words.A)} ${samp(words.N)} (${samp(physicalMediaTypes)})`,
          `${samp(samp(words))}, ${samp(words.N)} (${samp(
            physicalMediaTypes
          )})`,
          `${actionize(samp(words.V))} ${samp(words.N)} (${samp(
            physicalMediaTypes
          )})`,
          `What if ${samp(words.A)} ${pluralize(samp(words.N))}, but too much?`
        ])
      ),
    contents: () => new MockList([0, 12]),
    ...timestamps
  }),
  MetaDatumText: () => ({ string: casual.sentence, ...timestamps }),

  MetaDatumKeywords: () => ({
    keywords: () => new MockList([1, 12]),
    ...timestamps
  }),
  Keyword: () => ({
    name: samp(f.filter(words.N, s => s.length < 9)),
    ...timestamps
  }),

  MediaFile: () => ({
    mimeType: casual.mime_type,
    filename: `${samp(words.N)}.${casual.file_extension}`,
    sizeBytes: casual.integer(1, 1000000000),
    ...timestamps
  }),

  MetaKey: () => {
    return {
      id: (root, opts) => {
        return `${samp(f.filter(words.N, { length: 7 }))}:${samp(
          f.filter(words.N, { length: 5 })
        )}`.toLowerCase()
      },
      ...timestamps
    }
  },

  Vocabulary: () => ({
    ...timestamps
  }),

  User: () => ({
    displayName: (o, { style }) => displayName(style),
    ...timestamps
  }),
  Person: () => ({
    ...timestamps
  }),

  Query: () => ({
    mediaEntries: mockPaginatedListResolver,
    collections: mockPaginatedListResolver
  })
})

// fake data helpers
const samp = list => f.first(f.shuffle(list))
const pluralize = s => s.replace(/s$|$/, 's')
const actionize = s => s.replace(/ing$|$/, 'ing')

const mockPaginatedListResolver = (o, { limit }) => new MockList([limit, limit])

const timestamps = () =>
  [casual.moment.toDate(), casual.moment.toDate()]
    .sort((a, b) => a > b)
    .reduce((m, d, i) => ({ ...m, [i < 1 ? 'createdAt' : 'updatedAt']: d }), {})

const displayName = style => {
  // FULL, SHORT, INITIALS
  switch (style) {
    default:
      // 'FULL'
      return casual.full_name
    case 'SHORT':
      return `${f.first(casual.first_name)}. ${casual.last_name}`
    case 'INITIALS':
      return `${f.first(casual.first_name)}${f.first(casual.last_name)}`
  }
}

const physicalMediaTypes = [
  'Photo',
  'Song',
  'Album',
  'Concert',
  'Soundtrack',
  'Poster',
  'Postcard',
  'Flyer',
  'Magazine',
  'Painting',
  'Diploma'
]

const mockJsonKey = () =>
  f
    .shuffle(f.filter(words.N, { length: 5 }))
    .slice(0, 3)
    .map(titleCase)
    .join('')

const mockJsonValue = () =>
  samp([
    titleCase(samp(f.filter(words.A, w => w.length < 10))),
    casual.domain,
    casual.ip,
    casual.phone,
    casual.boolean,
    casual.timezone,
    casual.boolean,
    casual.color_name,
    casual.safe_color_name,
    casual.rgb_hex,
    casual.rgb_array,
    casual.country_code
  ])

// This function call adds the mocks to your schema!
addMockFunctionsToSchema({ schema, mocks: mocks() })
