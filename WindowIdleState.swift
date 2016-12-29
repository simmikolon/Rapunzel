//
//  WindowIdleState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 29.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class WindowIdleState: PlatformState {
    
    func randomBetweenNumbers(_ firstNum: CGFloat, secondNum: CGFloat) -> CGFloat{
        return CGFloat(arc4random()) / CGFloat(UINT32_MAX) * abs(firstNum - secondNum) + min(firstNum, secondNum)
    }
    
    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        elapsedTime = 0.0
        entity.animationComponent.requestedAnimation = WindowPlatformAnimationName.Normal.rawValue
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        elapsedTime += seconds
        
        let maxTime = randomBetweenNumbers(2, secondNum: 5)
        
        if elapsedTime > Double(maxTime) {
            stateMachine?.enter(WindowEnemyAppearingState.self)
        }
    }
    
    override func contactWithEntityDidBegin(_ entity: GKEntity) {
        
    }
    
    override func contactWithEntityDidEnd(_ entity: GKEntity) {
        
    }
}
