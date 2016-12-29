//
//  ParticleSpriteNode.swift
//  Rapunzel
//
//  Created by Simon Kemper on 25.02.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit

func randomBetweenNumbers(_ firstNum: CGFloat, secondNum: CGFloat) -> CGFloat{
    return CGFloat(arc4random()) / CGFloat(UINT32_MAX) * abs(firstNum - secondNum) + min(firstNum, secondNum)
}

class ParticleSpriteNode: SpriteNode {
    
    var column: Int = 0
    var row: Int = 0
    var damping = CGFloat(20.0)
    var minAlpha: CGFloat = 0.0
    var maxAlpha: CGFloat = 1.0
    
    override func setup() {
        
        let body = SKPhysicsBody(rectangleOf: CGSize(width: 2.5, height: 2.5))
        body.affectedByGravity = true
        body.mass = 0.001
        body.linearDamping = damping
        body.categoryBitMask = 0
        body.contactTestBitMask = 0
        body.collisionBitMask = 0
        physicsBody = body
        
        self.alpha = 0.5
        
        //startBlink()
    }
    
    func startBlink() {
        
        let durationInterval = randomBetweenNumbers(0.0, secondNum: 5.0)
        let durationAction = SKAction.wait(forDuration: TimeInterval(durationInterval))
        
        let fadeMinAction = SKAction.fadeAlpha(to: minAlpha, duration: 0.75)
        let fadeMaxAction = SKAction.fadeAlpha(to: maxAlpha, duration: 0.75)
        
        fadeMinAction.timingMode = SKActionTimingMode.easeOut
        fadeMaxAction.timingMode = SKActionTimingMode.easeIn
        
        let sequenceAction = SKAction.sequence([fadeMinAction, fadeMaxAction])
        let repeatAction = SKAction.repeatForever(sequenceAction)
        
        run(durationAction, completion: { () -> Void in
            
            self.run(repeatAction)
        }) 
    }
}
