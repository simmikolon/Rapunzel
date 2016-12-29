//
//  CollectableEntityState.swift
//  Rapunzel
//
//  Created by Simon Kemper on 30.05.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

class CollectableEntityState: PlatformState {

    override func didEnter(from previousState: GKState?) {
        super.didEnter(from: previousState)
        elapsedTime = 0.0
        
        let moveUpAction = SKAction.move(by: CGVector(dx: 0, dy: 25), duration: 1.0)
        moveUpAction.timingMode = .easeInEaseOut
        
        let moveDownAction = SKAction.move(by: CGVector(dx: 0, dy: -25), duration: 1.0)
        moveDownAction.timingMode = .easeInEaseOut
        
        entity.renderComponent.node.run(SKAction.repeatForever(SKAction.sequence([moveUpAction, moveDownAction])))
    }
    
    override func update(deltaTime seconds: TimeInterval) {
        super.update(deltaTime: seconds)
        elapsedTime += seconds
    }
    
    override func contactWithEntityDidBegin(_ entity: GKEntity) {
        self.entity.remove()
    }
    
    override func contactWithEntityDidEnd(_ entity: GKEntity) {
        
    }
}
