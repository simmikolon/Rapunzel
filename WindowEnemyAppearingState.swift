//
//  WindowEnemyAppearingState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class WindowEnemyAppearingState: PlatformState {

    func randomBetweenNumbers(_ firstNum: CGFloat, secondNum: CGFloat) -> CGFloat{
        return CGFloat(arc4random()) / CGFloat(UINT32_MAX) * abs(firstNum - secondNum) + min(firstNum, secondNum)
    }
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        elapsedTime = 0.0
        entity.animationComponent.requestedAnimation = WindowPlatformAnimationName.EnemyAppearing.rawValue
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        elapsedTime += seconds
        if elapsedTime > Double(randomBetweenNumbers(4.0, secondNum: 8.0)) {
            stateMachine?.enter(WindowIdleState)
        }
    }
    
    override func contactWithEntityDidBegin(_ entity: GKEntity) {
        
    }
    
    override func contactWithEntityDidEnd(_ entity: GKEntity) {
        
    }
}
