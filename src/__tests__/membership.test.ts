import { requireMembership } from '../../convex/lib/roles';

type User = {
  _id: string;
  clerkId: string;
  role: string;
};

type Membership = {
  _id: string;
  user_id: string;
  university_id: string;
  role: 'student' | 'advisor' | 'university_admin';
  status: 'active' | 'inactive' | 'revoked';
};

class QueryMock {
  private table: string;
  private user: User;
  private memberships: Membership[];
  private roleFilter?: string;
  private userIdFilter?: string;

  constructor(table: string, user: User, memberships: Membership[]) {
    this.table = table;
    this.user = user;
    this.memberships = memberships;
  }

  withIndex(_: string, fn?: (q: any) => any) {
    if (fn) {
      const queryApi: any = {
        eq: (_field: string, value: any) => {
          if (_field === 'user_id') this.userIdFilter = value;
          if (_field === 'role') this.roleFilter = value;
          return queryApi; // allow chaining
        },
      };
      fn(queryApi);
    }
    return this;
  }

  filter(fn: (q: any) => any) {
    const api = {
      eq: (_field: string, value: any) => {
        if (_field === 'role') this.roleFilter = value;
        return true;
      },
    };
    fn(api);
    return this;
  }

  async unique() {
    if (this.table === 'users') {
      return this.user;
    }
    return null;
  }

  async first() {
    if (this.table === 'memberships') {
      const match = this.memberships.find(
        (m) =>
          m.user_id === (this.userIdFilter || this.user._id) &&
          (!this.roleFilter || m.role === this.roleFilter) &&
          m.status === 'active',
      );
      return match || null;
    }
    return null;
  }
}

function makeCtx(user: User, memberships: Membership[]) {
  return {
    auth: {
      async getUserIdentity() {
        return { subject: user.clerkId };
      },
    },
    db: {
      query: (table: string) => new QueryMock(table, user, memberships),
    },
  } as any;
}

describe('requireMembership', () => {
  const user: User = { _id: 'user1', clerkId: 'clerk-user1', role: 'student' };
  const baseMembership: Membership = {
    _id: 'm1',
    user_id: 'user1',
    university_id: 'uni1',
    role: 'student',
    status: 'active',
  };

  it('returns membership when active and role matches', async () => {
    const ctx = makeCtx(user, [baseMembership]);
    const result = await requireMembership(ctx, { role: 'student' });
    expect(result.membership).toBeDefined();
    expect(result.membership.university_id).toBe('uni1');
  });

  it('throws when membership missing', async () => {
    const ctx = makeCtx(user, []);
    await expect(requireMembership(ctx, { role: 'student' })).rejects.toThrow(
      /Membership not found/,
    );
  });

  it('throws when membership role mismatches', async () => {
    const ctx = makeCtx(user, [{ ...baseMembership, role: 'advisor' } as Membership]);
    await expect(requireMembership(ctx, { role: 'student' })).rejects.toThrow(
      /Membership not found/,
    );
  });
});
