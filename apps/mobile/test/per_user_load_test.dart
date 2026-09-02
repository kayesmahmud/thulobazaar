import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/core/utils/per_user_load.dart';

class _Host extends StatefulWidget {
  final int? userId;
  final List<int> loads;
  const _Host({required this.userId, required this.loads});

  @override
  State<_Host> createState() => _HostState();
}

class _HostState extends State<_Host> with PerUserLoad {
  @override
  Widget build(BuildContext context) {
    loadOnceFor(widget.userId, () => widget.loads.add(widget.userId!));
    return const SizedBox();
  }
}

void main() {
  testWidgets('loads once per signed-in user, never for a guest', (
    tester,
  ) async {
    final loads = <int>[];

    await tester.pumpWidget(_Host(userId: null, loads: loads));
    await tester.pump();
    expect(loads, isEmpty);

    // Sign-in returned to this screen: same State, new user id.
    await tester.pumpWidget(_Host(userId: 7, loads: loads));
    await tester.pump();
    expect(loads, [7]);

    // Plain rebuilds do not reload.
    await tester.pumpWidget(_Host(userId: 7, loads: loads));
    await tester.pump();
    expect(loads, [7]);

    // A different account does.
    await tester.pumpWidget(_Host(userId: 9, loads: loads));
    await tester.pump();
    expect(loads, [7, 9]);
  });
}
