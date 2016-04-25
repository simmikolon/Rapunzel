//
//  RPPatternControllerComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 24.04.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct RPPatternSettings {
    
    static let elementsPerBeat: Int = 5
    static let lengthOfBeat: CGFloat = 300
}

class RPPatternControllerComponent: GKComponent {
    
    unowned let renderComponent: RPRenderComponent
    
    var offset: CGFloat = 0
    var pattern: RPPattern!
    
    var upperBeat: Int = 0
    var lowerBeat: Int = 0
    
    private var lastScrollingDelta: CGFloat = 0
    
    var platformEntities = [RPPlatformEntity]()
    
    func createDemoPattern() {
        pattern = RPPattern(withNumberOfBeats: 2)
        pattern.beats[0] = RPBeat(withType: .NotEmpty)
        pattern.beats[0].elements.append(RPBeatElement(withType: RPBeatElementType.LeftTreePlatform))
        pattern.beats[1] = RPBeat(withType: .NotEmpty)
        pattern.beats[1].elements.append(RPBeatElement(withType: RPBeatElementType.RightTreePlatform))
    }

    init(witLayerEntity layerEntity: RPLayerEntity) {
        
        guard let renderComponent = layerEntity.componentForClass(RPRenderComponent) else { fatalError() }
        self.renderComponent = renderComponent
        
        super.init()
        
        createDemoPattern()
        createStartupPatternBeats()
    }
    
    func addBeat() {
        
        let beat = pattern.beats[pattern.cursor]
        
        if beat.type != .Empty {
            
            for element in beat.elements {
                
                createElement(element)
            }
        }
        
        pattern.increaseCursor()
        offset += RPPatternSettings.lengthOfBeat
        upperBeat += 1
    }
    
    func createStartupPatternBeats() {
        
        let screenSize = CGSize(width: RPGameSceneSettings.width, height: RPGameSceneSettings.height)
        
        while offset < screenSize.height {
            addBeat()
        }
        
        addBeat()
    }
    
    func createElement(element: RPBeatElement) {
        
        let platform: RPPlatformEntity
        let horizontalOffset: CGFloat
        let verticalOffset: CGFloat = CGFloat(upperBeat) * RPPatternSettings.lengthOfBeat
        
        switch element.type {
            
            case .LeftTreePlatform:
                platform = RPLeftBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
                horizontalOffset = 320
            break
            
            default:
                platform = RPBranchPlatformEntity(isBreakable: false, isBottomCollidable: false)
                horizontalOffset = -320
            break
        }
        
        platform.renderComponent.node.position = CGPoint(x: horizontalOffset, y: verticalOffset)
        platform.renderComponent.node.zPosition = 1
        
        self.platformEntities.append(platform)
        self.renderComponent.addChild(platform.renderComponent.node)
    }
    
    func didScrollUpOneBeat() {
        addBeat()
    }
    
    func didScrollDownOneBeat() {
        
    }
    
    // MARK: - Lifecycle
    
    override func updateWithDeltaTime(seconds: NSTimeInterval) {
        super.updateWithDeltaTime(seconds)
        
        for platformEntity in platformEntities {
            platformEntity.updateWithDeltaTime(seconds)
        }
        
        let scrollingDelta = renderComponent.node.scene?.convertPoint(renderComponent.node.position, fromNode: renderComponent.node.parent!)
    
        if scrollingDelta!.y - lastScrollingDelta < -RPPatternSettings.lengthOfBeat {
            didScrollUpOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
        
        else if scrollingDelta!.y - lastScrollingDelta > RPPatternSettings.lengthOfBeat {
            didScrollDownOneBeat()
            lastScrollingDelta = scrollingDelta!.y
        }
    }
}
